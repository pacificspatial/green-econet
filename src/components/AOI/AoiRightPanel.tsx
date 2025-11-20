import { Box } from "@mui/system";
import ToggleButtons from "../utils/ToggleButton";
import AoiStatistics from "./AoiStatistics";
import { styled, useTheme } from "@mui/material/styles";
import { useCallback, useEffect, useMemo, useState } from "react";
import CustomDropDown from "../utils/CustomDropDown";
import { Geometry, Region, Regions } from "@/types/Region";
import { useTranslation } from "react-i18next";
import { getAoiToggleButtons } from "@/constants/aoiToggleButtons";
import { Button, Typography } from "@mui/material";
import { fetchAOIStatistics, fetchRegions } from "@/api/lookup";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import {
  setSelectedLandUseRegion,
  setSelectedPark,
  setSelectedRegion,
} from "@/redux/slices/selectedRegionSlice";
import { setSelectedAoi } from "@/redux/slices/selectedAoiSlice";
import {
  draftAoi,
  fetchDraftAoi,
  fetchSavedAoiThunk,
  saveAoi,
} from "@/api/project";
import { useParams } from "react-router-dom";
import AlertBox from "../utils/AlertBox";
import debounce from "lodash.debounce";
import Loader from "../common/Loader";
import { AlertState } from "@/types/AlertState";
import { Park, Parks } from "@/types/Park";
import { InfoOutlined } from "@mui/icons-material";
import {
  landUseRegionUsageTypes,
  parkUsageTypes,
  regionUsageTypes,
} from "@/constants/usageTypes";
import { LandUseRegion, LandUseRegions } from "@/types/LandUseRegion";

const StyledBox = styled(Box)(({ theme }) => ({
  backgroundColor:
    theme.palette.mode === "light" ? "#fff" : theme.palette.background.paper,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  alignItems: "center",
  height: "100%",
  width: "100%",
  position: "relative",
}));

const StyledGrid = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  minHeight: "70px",
  maxHeight: "75px",
  paddingTop: theme.spacing(0),
  paddingBottom: theme.spacing(0),
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
  backgroundColor: theme.palette.info.light + "22", // subtle tint (added transparency)
  borderLeft: `4px solid ${theme.palette.info.main}`,
  padding: theme.spacing(1.5, 2),
  borderRadius: theme.shape.borderRadius,
  fontSize: "0.9rem",
  color: theme.palette.text.secondary,
  lineHeight: 1.5,
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(1),
  marginLeft: theme.spacing(1),
  marginRight: theme.spacing(1),
}));

const StyledGridBottom = styled("div")(() => ({
  flex: 1,
  width: "100%",
  minHeight: "0px",
}));

const StyledConfirmBox = styled(Box)(() => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  width: "100%",
  minHeight: "50px",
  maxHeight: "70px",
  position: "relative",
  bottom: 5,
}));

const AoiRightPanel = () => {
  const [regions, setRegions] = useState<Regions>([]);
  const [fetchRegionsLoading, setFetchRegionsLoading] = useState(false);
  const [saveAoiLoading, setSaveAoiLoading] = useState(false);
  const [draftRegionLoading, setDraftRegionLoading] = useState(false);
  const [alert, setAlert] = useState<AlertState>({
    open: false,
    message: "",
    severity: "info",
  });
  const [emptyAoiMessage, setEmptyAoiMessage] = useState("");

  const { isProjectFrozen } = useAppSelector((state) => state.frozenProject);
  const selectedAoi = useAppSelector((state) => state.selectedAoi.aoiSelected);
  const selectedAoiPolygon = useAppSelector((state) => state.selectedAoi.geom);
  const {
    parkData: selectedPark,
    regionData: selectedRegion,
    landUseRegionData: selectedLandUseRegion,
  } = useAppSelector((state) => state?.selectedRegion);
  const { currentUsageType } = useAppSelector((state) => state?.projects);
  const { savedAoi } = useAppSelector((state) => state.savedAoi);
  
  const dispatch = useAppDispatch();
  const { projectId } = useParams();
  const { t } = useTranslation();
  const theme = useTheme();
  // since now watershed is disabled, we can simplify the selectedAoiValue
  const selectedAoiValue = useMemo(() => {
    return selectedAoi === 2 ? "region" : "polygon";
  }, [selectedAoi]);

  const handleSetAlert = useCallback(
    (message: string, severity: "success" | "error" | "info") => {
      setAlert({ open: true, message, severity });
    },
    []
  );

  //  Fetch the draft region / park AOI and set the selected region / park
  const fetchDraftRegionAoi = useCallback(async () => {
    try {
      const response = await fetchDraftAoi(
        projectId || "",
        2,
        currentUsageType?.value || ""
      );
      if (response.success) {
        const selectedRegion = regions.find(
          (region) => region.key_code === response?.data[0]?.region_id
        );
        if (selectedRegion) {
          dispatch(setSelectedRegion(selectedRegion));
        }
      } else {
        handleSetAlert(t("app.serverErrorMessage"), "error");
      }
    } catch (err) {
      console.error(err);
      handleSetAlert(t("app.serverErrorMessage"), "error");
    }
  }, [
    projectId,
    currentUsageType?.value,
    regions,
    dispatch,
    handleSetAlert,
    t,
  ]);

  const fetchDraftParkOrLandUseRegionAoi = useCallback(
    async (regionType: "park" | "landUseRegion" = "park") => {
      if (
        !currentUsageType ||
        (!landUseRegionUsageTypes.includes(currentUsageType.value) &&
          !parkUsageTypes.includes(currentUsageType.value))
      )
        return;
      try {
        const response = await fetchDraftAoi(
          projectId || "",
          2,
          currentUsageType?.value || ""
        );
        if (response.success) {
          const regionData: Parks | LandUseRegions = [];
          if (response?.data) {
            response.data?.map((region: { geom: Geometry; id: number }) => {
              const formattedPark: Park | LandUseRegion = {
                geom: region.geom,
                properties: {
                  id: region.id,
                },
              };
              regionData.push(formattedPark);
            });
            if (regionType === "landUseRegion") {
              dispatch(setSelectedLandUseRegion(regionData));
            } else {
              dispatch(setSelectedPark(regionData));
            }
          }
        } else {
          handleSetAlert(t("app.serverErrorMessage"), "error");
        }
      } catch (err) {
        console.error(err);
        handleSetAlert(t("app.serverErrorMessage"), "error");
      }
    },
    [currentUsageType, projectId, dispatch, handleSetAlert, t]
  );

  //fetch and set AOI statistics
  const fetchAndSetAoiStats = useCallback(
    async (selectedAoiTab: string) => {
      if (projectId) {
        // Dispatch the thunk
        dispatch(
          fetchAOIStatistics({
            projectId: projectId as string,
            aoiType: selectedAoiTab?.toString() as string,
          })
        );
      }
    },
    [dispatch, projectId]
  );

  //  Debounce the onSelectRegion function
  const debouncedOnSelectRegion = useMemo(
    () =>
      debounce(async (region: Region) => {
        if (region?.geom) {
          setDraftRegionLoading(true);
          try {
            const response = await draftAoi({
              geom: region.geom,
              aoi_type: 2,
              project_id: projectId || "",
              region_id: region.key_code,
            });

            if (response.success) {
              dispatch(setSelectedRegion(region));
              if (projectId && selectedAoi === savedAoi?.aoi_type) {
                const saveResponse = await saveAoi(projectId, {
                  aoi_type: selectedAoi,
                  usage_type: currentUsageType?.value || "",
                });
                if (saveResponse.success) {
                  handleSetAlert(t("app.aoiSaveSuccessMessage"), "success");
                  dispatch(fetchSavedAoiThunk(projectId));
                } else {
                  handleSetAlert(t("app.aoiSaveFailedMessage"), "error");
                }
              }
              //fetch and update statistics after selecting a region
              fetchAndSetAoiStats("2");
              setAlert({
                open: true,
                message: t("app.aoiRegionDraftSuccessMessage"),
                severity: "success",
              });
            } else {
              setAlert({
                open: true,
                message: t("app.aoiRegionDraftFailedMessage"),
                severity: "error",
              });
            }
          } catch (error) {
            console.error(error);
            setAlert({
              open: true,
              message: t("app.serverErrorMessage"),
              severity: "error",
            });
          } finally {
            setDraftRegionLoading(false);
          }
        }
      }, 300),
    [
      dispatch,
      fetchAndSetAoiStats,
      handleSetAlert,
      projectId,
      savedAoi?.aoi_type,
      selectedAoi,
      currentUsageType?.value,
      t,
    ]
  );

  //  This function is called when a region is selected
  const onSelectRegion = useCallback(
    (region: Region | null) => {
      if (region) {
        debouncedOnSelectRegion(region);
      }
    },
    [debouncedOnSelectRegion]
  );

  useEffect(() => {
    // usage type road planning disable region AOI option
    if (currentUsageType && !regionUsageTypes.includes(currentUsageType.value))
      return;
    const fetchRegionData = async () => {
      try {
        setFetchRegionsLoading(true);
        const regionsData = await fetchRegions();
        setRegions(regionsData);
      } catch (error) {
        console.error(error);
        handleSetAlert(t("app.serverErrorMessage"), "error");
      } finally {
        setFetchRegionsLoading(false);
      }
    };

    fetchRegionData();
  }, [t, handleSetAlert, currentUsageType]);

  useEffect(() => {
    //  Fetch draft region aoi when regions array changes
    if (
      regions.length > 0 &&
      currentUsageType &&
      regionUsageTypes.includes(currentUsageType.value)
    ) {
      fetchDraftRegionAoi();
    }
  }, [currentUsageType, fetchDraftRegionAoi, regions]);

  useEffect(() => {
    if (selectedAoi !== 2 || !currentUsageType) return;
    //  Fetch draft region aoi when regions array changes
    if (parkUsageTypes.includes(currentUsageType?.value)) {
      fetchDraftParkOrLandUseRegionAoi("park");
    } else if (landUseRegionUsageTypes.includes(currentUsageType.value)) {
      fetchDraftParkOrLandUseRegionAoi("landUseRegion");
    }
  }, [currentUsageType, fetchDraftParkOrLandUseRegionAoi, selectedAoi]);

  const setActiveAoi = useCallback(
    (value: string) => {
      setEmptyAoiMessage("");
      const selectedValue = value === "region" ? 2 : 1;
      dispatch(setSelectedAoi({ aoiSelected: selectedValue }));
      fetchAndSetAoiStats(selectedValue.toString());
    },
    [dispatch, fetchAndSetAoiStats]
  );

  const handleConfirmClick = async () => {
    try {
      setSaveAoiLoading(true);
      if (selectedAoi == 1 && !selectedAoiPolygon) {
        const message = t("app.emptyPolygonAoiMessage");
        setEmptyAoiMessage(message);

        // Clear the message after 5 seconds
        setTimeout(() => {
          setEmptyAoiMessage("");
        }, 5000);
      } else if (
        selectedAoi == 2 &&
        !selectedRegion &&
        (!selectedPark || selectedPark.length === 0) &&
        (!selectedLandUseRegion || selectedLandUseRegion.length === 0)
      ) {
        const message = !selectedRegion
          ? t("app.emptyRegionAoiMessage")
          : t("app.emptyParkAoiMessage");
        setEmptyAoiMessage(message);

        // Clear the message after 5 seconds
        setTimeout(() => {
          setEmptyAoiMessage("");
        }, 5000);
      } else {
        if (projectId) {
          const saveResponse = await saveAoi(projectId, {
            aoi_type: selectedAoi,
            usage_type: currentUsageType?.value || "",
          });
          if (saveResponse.success) {
            handleSetAlert(t("app.aoiSaveSuccessMessage"), "success");
            // Fetch the saved AOI and update Redux using thunk middleware
            dispatch(fetchSavedAoiThunk(projectId));
          } else {
            handleSetAlert(t("app.aoiSaveFailedMessage"), "error");
          }
        }
      }
    } catch (error) {
      console.error("Error while saving AOI", error);
      handleSetAlert(t("app.serverErrorMessage"), "error");
    } finally {
      setSaveAoiLoading(false);
    }
  };

  return (
    <StyledBox>
      {alert.open && (
        <AlertBox
          open={alert.open}
          onClose={() => setAlert({ ...alert, open: false })}
          message={alert.message}
          severity={alert.severity}
        />
      )}

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          alignItems: "center",
        }}
      >
        <StyledGrid>
          <ToggleButtons
            buttons={useMemo(
              () =>
                getAoiToggleButtons(t, savedAoi?.aoi_type, currentUsageType),
              [t, savedAoi, currentUsageType]
            )}
            onChange={setActiveAoi}
            defaultValue={selectedAoiValue}
          />
        </StyledGrid>

        {selectedAoiValue === "region" && (
          <>
            <StyledGrid
              sx={{
                width: "80%",
                paddingTop: theme.spacing(1),
                paddingBottom: theme.spacing(1),
              }}
            >
              {fetchRegionsLoading && (
                <Loader text={t("app.regionsFetchingLoadingText")} />
              )}

              <CustomDropDown
                disabled={
                  [...landUseRegionUsageTypes, ...parkUsageTypes].includes(
                    currentUsageType?.value || ""
                  ) || isProjectFrozen
                }
                options={regions}
                onSelect={onSelectRegion}
                label={t("app.selectRegion")}
                value={selectedRegion}
                getOptionLabel={(option) =>
                  `${option.city_name}, ${option.s_name}`
                }
                getOptionValue={(option) => option.key_code}
                renderOption={(option) => {
                  return (
                    <>
                      <span style={{ fontWeight: "bold" }}>
                        {option.city_name}
                      </span>
                      <span
                        style={{
                          fontStyle: "italic",
                          fontSize: "10px",
                          marginLeft: "5px",
                        }}
                      >
                        {option.s_name}
                      </span>
                    </>
                  );
                }}
              />

              {draftRegionLoading && (
                <Loader text={t("app.draftingRegionLoadingText")} />
              )}
            </StyledGrid>
            {currentUsageType &&
              ((parkUsageTypes.includes(currentUsageType.value) &&
                (!selectedPark || selectedPark?.length === 0)) ||
                (landUseRegionUsageTypes.includes(currentUsageType.value) &&
                  (!selectedLandUseRegion ||
                    selectedLandUseRegion?.length === 0))) && (
                <StyledTypography>
                  <InfoOutlined
                    fontSize="small"
                    sx={{ verticalAlign: "middle", mr: 1, color: "info.main" }}
                  />
                  {t("app.note")}
                  {": "}
                  {t(`app.${currentUsageType.noteLable}`) ||
                    t("app.parkRegionNote")}
                </StyledTypography>
              )}
          </>
        )}
      </Box>

      {/* This section takes the remaining space */}
      <StyledGridBottom>
        <AoiStatistics />
      </StyledGridBottom>

      <Typography color="red" fontSize={14}>
        {emptyAoiMessage}
      </Typography>
      <StyledConfirmBox>
        {saveAoiLoading && <Loader text={t("app.aoiSaveLoadingText")} />}
        <Button
          sx={{ position: "fixed", bottom: 5 }}
          color="primary"
          variant="contained"
          onClick={handleConfirmClick}
          disabled={isProjectFrozen}
        >
          {t("app.confirmAOI")}
        </Button>
      </StyledConfirmBox>
    </StyledBox>
  );
};

export default AoiRightPanel;
