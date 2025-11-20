import { fetchSavedAoiThunk } from "@/api/project";
import RightPanel from "@/components/common/RightPanel";
import TabHeader from "@/components/common/TabHeader";
import Map from "@/components/maps/Map";
import AlertBox from "@/components/utils/AlertBox";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { setFrozenProjectState } from "@/redux/slices/frozenProjectSlice";
import { resetError, resetSavedAoi } from "@/redux/slices/savedAoi";
import { clearSelectedAoi, setSelectedAoi } from "@/redux/slices/selectedAoiSlice";
import { Alert } from "@mui/material";
import Grid from "@mui/material/Grid";
import { Box, styled } from "@mui/system";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import frozenProjects from "@/assets/frozenProjects.json";
import { fetchAOIStatistics } from "@/api/lookup";
import { resetAOIStatistics } from "@/redux/slices/aoiStatistics";
import {
  clearSelectedLandUseRegion,
  clearSelectedPark,
  clearSelectedRegion,
} from "@/redux/slices/selectedRegionSlice";

const Container = styled(Box)({
  display: "flex",
  justifyContent: "center",
  alignItems: "stretch",
  width: "100%",
  position: "sticky",
  top: 0,
  height: "100%",
});

const MapGrid = styled(Grid)({
  flex: 3,
});

const PanelGrid = styled(Grid)({
  flex: 1,
  overflow: "hidden",
});

const Project = () => {
  const center: [number, number] = [138.2529, 36.2048];
  const zoom = 5.5;
  const [selectedTab, setSelectedTab] = useState<string>("aoi");
  const { projectId } = useParams();
  const dispatch = useAppDispatch();
  const { savedAoi, error } = useAppSelector((state) => state.savedAoi);
  const aoiStatistics = useAppSelector((state) => state.aoiStatistics);
  const { t } = useTranslation();
  const { isProjectFrozen } = useAppSelector((state) => state.frozenProject);
  const projects = useAppSelector((state) => state.projects.projects);

  useEffect(() => {
    const availableProjectIds = projects.map((project) =>
      project.project_id?.toString()
    );
    if (!availableProjectIds.includes(projectId)) {
      window.location.href = "/";
    }
  }, [projectId, projects]);

  const handleFetchSavedAoi = useCallback(() => {
    if (projectId) {
      dispatch(fetchSavedAoiThunk(projectId));
    }
  }, [dispatch, projectId]);

  const fetchAoiStatistics = useCallback(
    (aoiType: number) => {
      dispatch(resetAOIStatistics());
      if (projectId) {
        dispatch(
          fetchAOIStatistics({
            projectId: projectId,
            aoiType: aoiType.toString(),
          })
        );
      }
    },
    [dispatch, projectId]
  );

  useEffect(() => {
    if (projectId) {
      handleFetchSavedAoi();

      // const frozenProjectIds = Object.values(frozenProjects);
      const frozenProjectIds = frozenProjects as string[];
      const isFrozen = frozenProjectIds?.includes(projectId);
      dispatch(setFrozenProjectState(isFrozen));
    }
  }, [handleFetchSavedAoi, projectId, dispatch]);

  useEffect(() => {
    return () => {
      dispatch(resetAOIStatistics());
      dispatch(resetSavedAoi());
      dispatch(clearSelectedRegion());
      dispatch(clearSelectedPark());
      dispatch(clearSelectedLandUseRegion());
      dispatch(clearSelectedAoi());
    };
  }, []);

  useEffect(() => {
    if (savedAoi?.aoi_type) {
      dispatch(setSelectedAoi({ aoiSelected: savedAoi.aoi_type }));
      // Fetch statistics for the saved AOI type when it's available

      if (aoiStatistics[Number(savedAoi.aoi_type)]?.data === null) {
        fetchAoiStatistics(savedAoi.aoi_type);
      }
    }
  }, [savedAoi, dispatch, fetchAoiStatistics, projectId]);

  const onTabHeaderToggleChange = (value: string) => {
    setSelectedTab(value);
  };

  const handleAlertClose = () => {
    dispatch(resetError());
  };

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        position: "sticky",
        top: 0,
      }}
    >
      {isProjectFrozen && (
        <Alert
          severity="warning"
          sx={{
            width: "100%",
            textAlign: "center",
            fontWeight: "bold",
            minHeight: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {t("app.projectFrozenMessage")}
        </Alert>
      )}
      <TabHeader onToggleChange={onTabHeaderToggleChange} />
      <Container>
        <MapGrid>
          <Map center={center} zoom={zoom} selectedTab={selectedTab} />
        </MapGrid>
        <PanelGrid sx={{ height: isProjectFrozen ? "80vh" : "85vh" }}>
          <RightPanel selectedTab={selectedTab} />
        </PanelGrid>
      </Container>
      {/* AlertBox for error */}
      {error && (
        <AlertBox
          open={true}
          severity="error"
          message={t("app.errorFetchingSavedAoiMessage")}
          onClose={handleAlertClose}
        />
      )}
    </Box>
  );
};

export default Project;
