import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  AlertColor,
  Box,
  Button,
  Modal,
  SxProps,
  Theme,
  Typography,
} from "@mui/material";
import { useBasemap } from "@/hooks/useBasemap";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import { initializeMap } from "@/utils/mapUtils";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { useParams } from "react-router-dom";
import {
  addShape,
  draftAoi,
  fetchDraftAoi,
  fetchSavedAoiThunk,
  getShapes,
  removeAoi,
  saveAoi,
} from "@/api/project";
import { Geometry } from "@/types/Region";
import Loader from "../common/Loader";
import { useTranslation } from "react-i18next";
import AlertBox from "../utils/AlertBox";
import { AlertState } from "@/types/AlertState";
import RainTypeDropDown from "../simulation/RainTypeDropDown";
import {
  DrawType,
  getOptionsForDrawType,
  getSimulationTypeDropDown,
  RainGardenOption,
} from "@/constants/simulationTypeDropDown";
import { styled, useTheme } from "@mui/system";
import { SimulationManualData } from "@/types/SimulationManualData";
import { displayShapeOnMap } from "@/utils/map/displayShape";
import { cleanupDrawTool } from "@/utils/map/drawToolCleanUp";
import { initializeDrawTool } from "@/utils/map/initilizeDrawtool";
import { handleDraftAOIVisualization } from "@/utils/map/handleDraftAOIVisualization";
import { handleAOIVisualization } from "@/utils/map/handleAOIVisualization";
import {
  handleMultipleRegionVisualization,
  handleRegionVisualization,
} from "@/utils/map/handleRegionVisualization";
import {
  getAoiLocationLayers,
  getAoiHazardLayers,
  getAoiLizardLayers,
  getAoiDragonflyLayers,
  getAoiWhiteeyeLayers,
  getAoiWatershedLayers,
  fetchParks,
  fetchAOIStatistics,
  fetchRoadLayer,
  fetchLandUseRegions,
} from "@/api/lookup";
import Legend from "./Legend";
import {
  fetchProjectPointResult,
  fetchProjectPolygonResult,
} from "@/api/result";
import { LayerConfig, PointResult, PolygonResult } from "@/types/LayerConfig";
import { layerConfigs } from "@/config/layers/aoiLayers";
import { addStyledLayer, removeStyledLayer } from "@/utils/map/addLayer";
import {
  createHabitatLayerConfig,
  createRainGardenLayerConfig,
  LAYER_IDS,
} from "@/config/layers/resultLayer";
import { setSelectedAoiPolygonGeom } from "@/redux/slices/selectedAoiSlice";
import { hazardColors } from "@/constants/aoiLayerColors";
import {
  aoiLayerVisibility,
  resultLayerVisibility,
  simulationLayerVisibility,
} from "@/config/layers/initialLayerVisibility";
import {
  cleanupLineDrawing,
  createLineDrawingState,
  handleLineDrawingCancel,
  handleLineDrawingClick,
  handleLineDrawingModeChange,
  handleLineDrawingRender,
  handleLineUpdatingClick,
} from "@/utils/map/lineInputPopoverHandler";
import { useLineDrawButtonTooltip } from "@/hooks/useLineDrawButtonTooltip";
import {
  DrawCreateHandlerParams,
  DrawDeleteHandlerParams,
  DrawUpdateHandlerParams,
  handleDrawCreate,
  handleDrawDelete,
  handleDrawUpdate,
} from "@/utils/map/drawHandlers";
import { removeShapeFromMap } from "@/utils/map/removeShape";
import { LENGTH_INCREMENT } from "@/constants/numberConstants";
import { setCurrentProject } from "@/redux/slices/projectSlice";
import { Park, Parks } from "@/types/Park";
import {
  setSelectedLandUseRegion,
  setSelectedPark,
} from "@/redux/slices/selectedRegionSlice";
import {
  landUseRegionUsageTypes,
  parkUsageTypes,
} from "@/constants/usageTypes";
import { LandUseRegion, LandUseRegions } from "@/types/LandUseRegion";

// Declare mapbox-gl module augmentation for the accessToken
declare global {
  interface Window {
    mapboxgl: typeof mapboxgl;
  }
}

// Type for the Map component props
interface MapProps {
  center?: [number, number];
  zoom?: number;
  highResolution?: boolean;
  collapsed?: boolean;
  selectedTab?: string;
  sx?: SxProps<Theme>;
}

type SimulationPolygon = GeoJSON.Feature<GeoJSON.Geometry>;

const StyledBox = styled(Box)(({ theme }) => ({
  backgroundColor:
    theme.palette.mode === "light" ? "#fff" : theme.palette.background.paper,
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  borderRadius: "10px",
  padding: theme.spacing(4),
}));

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN || "";

const Map: React.FC<MapProps> = ({
  highResolution = false,
  collapsed = false,
  selectedTab,
  sx = {},
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [alert, setAlert] = useState<AlertState>({
    open: false,
    message: "",
    severity: "info",
  });
  const [selectedRainGardenType, setSelectedRainGardenType] =
    useState<RainGardenOption | null>(null);
  const [selectedSubRainGardenType, setSelectedSubRainGardenType] =
    useState<RainGardenOption | null>(null);
  const [shapeSavingLoading, setShapeSavingLoading] = useState(false);
  const [pointResults, setPointResults] = useState<PointResult[]>([]);
  const [polygonResults, setPolygonResults] = useState<PolygonResult[]>([]);
  const [parksDatas, setParksDatas] = useState<Parks | null>(null);
  const [landUseRegions, setLandUseRegions] = useState<LandUseRegions | null>(
    null
  );
  const [polygonDraftAoi, setPolygonDraftAoi] = useState<Geometry | null>();
  const [simulationPolygon, setSimulationPolygon] =
    useState<SimulationPolygon | null>(null);
  const [drawnShapeType, setDrawnShapeType] = useState<DrawType | null>(null);
  const [draftParkRegionLoading, setDraftParkRegionLoading] =
    useState<boolean>(false);
  const [removingRegionLoading, setRemovingRegionLoading] =
    useState<boolean>(false);
  const [fetchParksLoading, setFetchParksLoading] = useState(false);
  const [fetchLandUseRegionLoading, setFetchLandUseRegionLoading] =
    useState(false);

  const { isProjectFrozen } = useAppSelector((state) => state.frozenProject);
  const { savedAoi } = useAppSelector((state) => state?.savedAoi);
  const {
    regionData: selectedRegion,
    parkData: selectedPark,
    landUseRegionData: selectedLandUseRegion,
  } = useAppSelector((state) => state?.selectedRegion);
  const { aoiSelected: selectedAoi, geom: selectedAoiGeom } = useAppSelector(
    (state) => state?.selectedAoi
  );
  const { projects, currentUsageType } = useAppSelector(
    (state) => state?.projects
  );

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const drawInstance = useRef<MapboxDraw | null>(null);
  const latestPolygonRef = useRef<Geometry | null>(null);
  const selectedShapeRef = useRef<Geometry | null>(null);
  const lineDrawingStateRef = useRef(createLineDrawingState());
  const mouseMoveHandlerRef = useRef<
    ((e: mapboxgl.MapMouseEvent) => void) | null
  >(null);
  const selectedAoiGeomString = useMemo(
    () => JSON.stringify(selectedAoiGeom),
    [selectedAoiGeom]
  );

  const { basemap } = useBasemap();
  const theme = useTheme();
  const { projectId } = useParams();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  // Tooltip for line draw button
  useLineDrawButtonTooltip(
    t("app.drawCustomRoute", { increment: LENGTH_INCREMENT }),
    selectedTab || ""
  );

  // Get dropdown options using translation function
  const rainGardenOptions = getSimulationTypeDropDown(t);
  const draw =
    ((selectedAoi === 1 && selectedTab === "aoi") ||
      selectedTab === "simulation") &&
    !isProjectFrozen;

  const handleSetAlert = useCallback(
    (message: string, severity: AlertColor) => {
      setAlert({ open: true, message, severity });
    },
    []
  );
  const filteredRainGardenOptions = useMemo(() => {
    if (!drawnShapeType) return [];
    return getOptionsForDrawType(rainGardenOptions, drawnShapeType);
  }, [drawnShapeType, rainGardenOptions]);
  const hasSubOptions = useCallback((option: RainGardenOption): boolean => {
    return !!(option.subOptions && option.subOptions.length > 0);
  }, []);

  const getSubOptions = useCallback(
    (option: RainGardenOption): RainGardenOption[] => {
      return option.subOptions || [];
    },
    []
  );

  const getDrawTypeFromGeometry = (geometry: Geometry): DrawType | null => {
    switch (geometry.type) {
      case "Point":
      case "MultiPoint":
        return "point";
      case "LineString":
      case "MultiLineString":
        return "line";
      case "Polygon":
      case "MultiPolygon":
        return "polygon";
      default:
        return null;
    }
  };

  const onDrawSelectionChange = useCallback(
    (e: MapboxDraw.DrawSelectionChangeEvent) => {
      if (e.features && e.features.length > 0) {
        selectedShapeRef.current = e.features[0].geometry as Geometry;
      } else {
        selectedShapeRef.current = null;
      }
    },
    []
  );

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || selectedTab !== "simulation") return;

    map.on("draw.selectionchange", onDrawSelectionChange);

    return () => {
      map.off("draw.selectionchange", onDrawSelectionChange);
    };
  }, [selectedTab, onDrawSelectionChange]);

  useEffect(() => {
    if (polygonDraftAoi) latestPolygonRef.current = polygonDraftAoi;
  }, [polygonDraftAoi]);

  useEffect(() => {
    if (projectId) {
      dispatch(
        setCurrentProject(
          projects.find((p) => String(p.project_id) === String(projectId)) ||
            null
        )
      );
    }
    return () => {
      dispatch(setCurrentProject(null));
    };
  }, [projects, projectId, dispatch]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !drawInstance.current || selectedTab !== "simulation") return;

    // Setup mousemove handler function that can be referenced
    const setupMouseMoveHandler = (
      handler: (e: mapboxgl.MapMouseEvent) => void
    ) => {
      mouseMoveHandlerRef.current = handler;
      map.on("mousemove", handler);
    };

    // Cleanup function
    const performCleanup = () => {
      cleanupLineDrawing(lineDrawingStateRef, map, mouseMoveHandlerRef.current);
      mouseMoveHandlerRef.current = null;
    };

    // Event handlers using the utility functions
    const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
      const draw = drawInstance.current;
      if (!draw) return;

      const currentMode = draw.getMode();
      handleLineDrawingClick(
        e,
        currentMode,
        lineDrawingStateRef,
        map,
        setupMouseMoveHandler
      );
      handleLineUpdatingClick(
        e,
        currentMode,
        lineDrawingStateRef,
        map,
        draw,
        setupMouseMoveHandler
      );
    };

    const handleDrawModeChange = (e: { mode: string }) => {
      handleLineDrawingModeChange(e, lineDrawingStateRef, performCleanup);
    };

    const handleDrawRender = () => {
      handleLineDrawingRender(
        drawInstance.current,
        lineDrawingStateRef,
        performCleanup
      );
    };

    const handleDrawCancel = () => {
      handleLineDrawingCancel(lineDrawingStateRef, performCleanup);
    };

    // Add event listeners
    map.on("click", handleMapClick);
    map.on("draw.modechange", handleDrawModeChange);
    map.on("draw.render", handleDrawRender);
    map.on("draw.cancel", handleDrawCancel);

    // Cleanup function
    return () => {
      map.off("click", handleMapClick);
      map.off("draw.modechange", handleDrawModeChange);
      map.off("draw.render", handleDrawRender);
      map.off("draw.cancel", handleDrawCancel);

      performCleanup();
    };
  }, [selectedTab, mapInstance.current, drawInstance.current]);

  //functions to save aoi and fetch drafted aoi.
  const saveDraftAoi = useCallback(
    async (geometry: Geometry) => {
      if (selectedTab !== "aoi") return;

      try {
        setLoading(true);
        setLoadingText(t("app.savingDraftAoiLoading"));
        const response = await draftAoi({
          project_id: projectId || "",
          geom: geometry,
          aoi_type: 1,
        });

        if (response.success) {
          handleSetAlert(t("app.aoiSavedSuccessfully"), "success");
        } else {
          handleSetAlert(t("app.errorSavingAoi"), "error");
        }
      } catch (error) {
        console.error("Error saving draft AOI:", error);
        handleSetAlert(t("app.unexpectedError"), "error");
      } finally {
        setLoading(false);
        setLoadingText("");
      }
    },
    [selectedTab, t, projectId, handleSetAlert]
  );

  const fetchAndSetupDraftAoi = useCallback(async () => {
    if (selectedAoi === 1) {
      try {
        const response = await fetchDraftAoi(
          projectId || "",
          1,
          currentUsageType?.value || ""
        );
        if (response.data[0]?.geom) {
          dispatch(setSelectedAoiPolygonGeom(response.data[0]?.geom));
          setPolygonDraftAoi(response.data[0].geom);
        } else {
          dispatch(setSelectedAoiPolygonGeom(null));
          setPolygonDraftAoi(null);
        }
      } catch (error) {
        console.error("Error fetching draft AOI:", error);
      }
    }
  }, [projectId, selectedAoi, savedAoi]);

  const handleDrawCreateSync = useCallback(
    (e: MapboxDraw.DrawCreateEvent) => {
      const geometry = e.features[0]?.geometry;
      if (geometry) {
        const drawType = getDrawTypeFromGeometry(geometry as Geometry);
        setDrawnShapeType(drawType);
      }
      const params: DrawCreateHandlerParams = {
        event: e,
        selectedTab: selectedTab || "",
        projectId: projectId || "",
        drawInstance,
        dispatch,
        t,
        handleSetAlert,
        setLoading,
        setLoadingText,
        setSimulationPolygon,
        setDialogOpen,
        setPolygonDraftAoi,
        saveDraftAoi,
      };

      // Fire and forget the async operation
      handleDrawCreate(params).catch(console.error);
    },
    [selectedTab, projectId, dispatch, t, handleSetAlert, saveDraftAoi]
  );

  const handleDrawUpdateSync = useCallback(
    (e: MapboxDraw.DrawUpdateEvent) => {
      const params: DrawUpdateHandlerParams = {
        event: e,
        selectedTab: selectedTab || "",
        projectId: projectId || "",
        drawInstance,
        mapInstance,
        dispatch,
        t,
        handleSetAlert,
        setLoading,
        setLoadingText,
        latestPolygonRef,
        selectedShapeRef,
        lineDrawingStateRef,
        mouseMoveHandlerRef,
        saveDraftAoi,
        selectedAoi,
        savedAoi,
        usageType: currentUsageType ? currentUsageType.value : null,
        currentUsageType,
      };

      handleDrawUpdate(params).catch(console.error);
    },
    [
      selectedTab,
      projectId,
      dispatch,
      t,
      handleSetAlert,
      saveDraftAoi,
      selectedAoi,
      savedAoi,
      currentUsageType,
    ]
  );

  const handleDrawDeleteSync = useCallback(
    (e: MapboxDraw.DrawDeleteEvent) => {
      const params: DrawDeleteHandlerParams = {
        event: e,
        selectedTab: selectedTab || "",
        projectId: projectId || "",
        drawInstance,
        mapInstance,
        dispatch,
        t,
        handleSetAlert,
        setLoading,
        setLoadingText,
        setPolygonDraftAoi,
      };

      handleDrawDelete(params).catch(console.error);
    },
    [selectedTab, projectId, dispatch, t, handleSetAlert]
  );

  //simulation related functions
  const handleDialogClose = () => {
    setSimulationPolygon(null);
    setDrawnShapeType(null);
    drawInstance.current?.delete(simulationPolygon?.id as string);
    setDialogOpen(false);
    setSelectedRainGardenType(null);
  };

  const handleRainGardenTypeChange = (option: RainGardenOption | null) => {
    setSelectedRainGardenType(option);
    setSelectedSubRainGardenType(null);
  };

  const handleRainGardenSubTypeChange = (
    parentOption: RainGardenOption,
    subOption: RainGardenOption
  ) => {
    setSelectedRainGardenType(parentOption);
    setSelectedSubRainGardenType(subOption);
  };

  const handleSimulationPolygonTypeConfirmation = async () => {
    try {
      if (projectId && simulationPolygon && selectedRainGardenType) {
        setShapeSavingLoading(true);

        // Determine which rain type to use
        let rainType = selectedRainGardenType.value;
        let subRainType = null;

        // If we have a sub-option selected, use its value
        if (selectedSubRainGardenType) {
          rainType = selectedRainGardenType.value;
          subRainType = selectedSubRainGardenType.value;
        }

        const shapeSaved = await dispatch(
          addShape({
            project_id: projectId,
            shapeData: {
              geom: simulationPolygon?.geometry as Geometry,
              rain_type: rainType,
              sub_rain_type: subRainType || null,
            },
          })
        );

        if (shapeSaved) {
          displayShapeOnMap(
            mapInstance,
            drawInstance,
            shapeSaved.payload.shape_id,
            simulationPolygon.geometry as Geometry,
            false
          );
          handleSetAlert(t("app.shapeSavedSuccessMessage"), "success");
        } else {
          if (simulationPolygon.geometry) {
            removeShapeFromMap(
              mapInstance,
              drawInstance,
              simulationPolygon.geometry
            );
          }
          handleSetAlert(t("app.shapeSavedFailedMessage"), "error");
        }
      }
      setSelectedRainGardenType(null);
      setSelectedSubRainGardenType(null);
      setDialogOpen(false);
    } catch (error) {
      handleSetAlert(t("app.shapeSavedFailedMessage"), "error");
      console.error(error);
    } finally {
      setShapeSavingLoading(false);
    }
  };

  const fetchAndDisplayShapes = useCallback(async () => {
    if (!projectId || !mapInstance.current) return;

    try {
      setLoading(true);
      setLoadingText(t("app.savedShapesCheckMessage"));

      // Force fetch fresh data from the server
      const response = await dispatch(getShapes(projectId));
      const fetchedShapes = response.payload;

      if (response && fetchedShapes && fetchedShapes.length > 0) {
        // Use the freshly fetched shapes instead of the state
        fetchedShapes.forEach((shape: SimulationManualData) => {
          if (shape.shape_id && shape.geom) {
            displayShapeOnMap(
              mapInstance,
              drawInstance,
              shape.shape_id,
              shape.geom as Geometry,
              false
            );
          }
        });
      }
    } catch (error) {
      console.error("Error fetching shapes:", error);
    } finally {
      setLoading(false);
      setLoadingText("");
    }
  }, [dispatch, projectId, t]);

  // Initialize map
  useEffect(() => {
    if (!mapInstance.current && mapContainerRef.current) {
      mapInstance.current = initializeMap({
        container: mapContainerRef.current,
        center: [139.652424, 35.652423],
        zoom: 12,
        basemap,
        highResolution,
      });

      mapInstance.current.once("style.load", () => {
        if (mapInstance.current) {
          mapInstance.current.flyTo({
            center: [139.652424, 35.652423],
            zoom: 12,
          });
        }
      });
    }

    // Cleanup function
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [basemap, highResolution, collapsed]);

  const memoizedTheme = useMemo(() => theme, [theme]);

  const updateRegionVisualization = useCallback(
    async (map: mapboxgl.Map) => {
      if (
        currentUsageType &&
        landUseRegionUsageTypes.includes(currentUsageType.value)
      ) {
        await handleMultipleRegionVisualization(map, selectedLandUseRegion, {
          fillColor: memoizedTheme.palette.primary.main,
          fillOpacity: 0.05,
        });
      } else if (
        currentUsageType &&
        parkUsageTypes.includes(currentUsageType.value)
      ) {
        await handleMultipleRegionVisualization(map, selectedPark, {
          fillColor: memoizedTheme.palette.primary.main,
          fillOpacity: 0.05,
        });
      } else {
        await handleRegionVisualization(map, selectedRegion, {
          fillColor: memoizedTheme.palette.primary.main,
          fillOpacity: 0.05,
        });
      }
    },
    [currentUsageType, selectedPark, selectedRegion, selectedLandUseRegion]
  );

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    const removeLayerFromMap = () => {
      if (!mapInstance?.current) return;

      if (map.getLayer("selectedRegionLayer")) {
        map.removeLayer("selectedRegionLayer");
      }
      if (map.getLayer("selectedMultiRegionLayer")) {
        map.removeLayer("selectedMultiRegionLayer");
      }
      if (map.getLayer("selectedRegionBorderLayer")) {
        map.removeLayer("selectedRegionBorderLayer");
      }
      if (map.getLayer("selectedMultiRegionBorderLayer")) {
        map.removeLayer("selectedMultiRegionBorderLayer");
      }
      if (map.getSource("selectedRegion")) {
        map.removeSource("selectedRegion");
      }
      if (map.getSource("selectedMultiRegion")) {
        map.removeSource("selectedMultiRegion");
      }
    };

    if (selectedAoi !== 2 || selectedTab !== "aoi" || !projectId) {
      removeLayerFromMap();
      return;
    }

    if (selectedRegion || selectedPark || selectedLandUseRegion) {
      updateRegionVisualization(map);
    }

    return () => {
      if (mapInstance?.current) {
        removeLayerFromMap();
      }
    };
  }, [
    selectedRegion,
    projectId,
    selectedAoi,
    selectedTab,
    basemap,
    selectedPark,
    selectedLandUseRegion,
    updateRegionVisualization,
  ]);

  // Fetch and display shapes when necessary
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    const removeSavedAOILayer = () => {
      if (map.getLayer("savedAOILayer")) {
        map.removeLayer("savedAOILayer");
      }
      if (map.getLayer("savedAOILayer-outline")) {
        map.removeLayer("savedAOILayer-outline");
      }
      if (map.getSource("savedAOI")) {
        map.removeSource("savedAOI");
      }
    };

    if (selectedTab === "simulation" || selectedTab === "result") {
      // Fetch and display shapes first
      if (selectedTab === "simulation") {
        fetchAndDisplayShapes();
      }

      // Fetch latest AOI when switching to simulation tab
      // Call the utility function to handle AOI visualization
      if (savedAoi && savedAoi.geom) {
        handleAOIVisualization(map, savedAoi.geom, {
          fillColor: memoizedTheme.palette.primary.main,
          fillOpacity: 0.1,
          lineColor: memoizedTheme.palette.primary.main,
          lineWidth: 8,
        });
      }
    } else if (selectedTab === "aoi") {
      removeSavedAOILayer();
    }

    return () => {
      if (mapInstance.current && drawInstance.current) {
        cleanupDrawTool({
          mapInstance: mapInstance.current,
          drawInstance: drawInstance.current,
          handleDrawCreate: handleDrawCreateSync,
          handleDrawUpdate: handleDrawUpdateSync,
          handleDrawDelete: handleDrawDeleteSync,
        });
        drawInstance.current = null;
      }
    };
  }, [
    handleDrawCreateSync,
    handleDrawUpdateSync,
    handleDrawDeleteSync,
    projectId,
    selectedTab,
    dispatch,
    savedAoi,
    basemap,
  ]);

  // Fetch and setup draft AOI
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    // Initialize draw tool and cleanup functions
    const setupDrawTools = () => {
      if (draw) {
        if (drawInstance.current) {
          cleanupDrawTool({
            mapInstance: mapInstance.current,
            drawInstance: drawInstance.current,
            handleDrawCreate: handleDrawCreateSync,
            handleDrawUpdate: handleDrawUpdateSync,
            handleDrawDelete: handleDrawDeleteSync,
          });
          drawInstance.current = null;
        }
        // Initialize the new draw tool instance
        drawInstance.current = initializeDrawTool(
          map,
          (selectedTab === "aoi" && selectedAoiGeom === null) ||
            (savedAoi?.aoi_type === 1 && savedAoi.geom === null) ||
            selectedTab === "simulation",
          handleDrawCreateSync,
          handleDrawUpdateSync,
          handleDrawDeleteSync,
          theme,
          selectedTab === "simulation"
        );

        // Fetch draft AOI
        if (selectedTab === "aoi" && selectedAoi === 1) {
          fetchAndSetupDraftAoi();
        }
      } else {
        cleanupDrawTool({
          mapInstance: mapInstance.current,
          drawInstance: drawInstance.current,
          handleDrawCreate: handleDrawCreateSync,
          handleDrawUpdate: handleDrawUpdateSync,
          handleDrawDelete: handleDrawDeleteSync,
        });
      }
    };

    // Handle initial setup and style changes
    if (projectId) {
      setupDrawTools();
    }
  }, [
    draw,
    selectedAoi,
    projectId,
    basemap,
    selectedTab,
    savedAoi,
    t,
    selectedAoiGeomString,
  ]);

  //polygon draft AOI useEffect
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    const addDraftAoiToDraw = () => {
      if (!drawInstance.current || !polygonDraftAoi) return;
      // Call the utility function to add the draft AOI and fit the map bounds
      handleDraftAOIVisualization(map, drawInstance.current, polygonDraftAoi);
    };

    const removeDraftAoiFromDraw = () => {
      if (!drawInstance.current) return;

      // Remove the draft AOI feature from the draw instance
      const allFeatures = drawInstance.current.getAll();
      const draftAoiFeature = allFeatures.features.find(
        (f) => f.id === "draft-aoi"
      );

      if (draftAoiFeature) {
        drawInstance.current.delete("draft-aoi");
      }
    };

    const setupDraftAoi = () => {
      if (selectedAoi === 1 && selectedTab === "aoi") {
        if (polygonDraftAoi) {
          addDraftAoiToDraw();
        } else {
          removeDraftAoiFromDraw();
        }
      }
    };

    if (map.isStyleLoaded()) {
      setupDraftAoi();
    } else {
      map.once("style.load", setupDraftAoi);
    }
  }, [polygonDraftAoi, selectedAoi, basemap, savedAoi, selectedTab]);

  const fetchAllLayers = () => {
    // Create an array of promises with their identifiers and corresponding configs
    const promises = [
      {
        name: "Lizard Layers",
        promise: getAoiLizardLayers(),
        config: layerConfigs.lizardHabitat,
      },
      {
        name: "Dragonfly Layers",
        promise: getAoiDragonflyLayers(),
        config: layerConfigs.dragonflyHabitat,
      },
      {
        name: "WhiteEye Layers",
        promise: getAoiWhiteeyeLayers(),
        config: layerConfigs.whiteyeHabitat,
      },
      {
        name: "Watershed Layers",
        promise: getAoiWatershedLayers(),
        config: layerConfigs.watershed,
      },
      {
        name: "Location Layers",
        promise: getAoiLocationLayers(),
        config: layerConfigs.locations,
      },
    ];

    if (currentUsageType?.value === "road_planning" && selectedTab === "aoi") {
      promises.push({
        name: "Road Layers",
        promise: fetchRoadLayer(),
        config: layerConfigs.roads,
      });
    }

    // Handle hazard layers separately
    getAoiHazardLayers()
      .then(async (hazardData) => {
        if (mapInstance.current && hazardData?.length > 0) {
          // Process each hazard value as a separate layer
          const hazardValues = [1, 2, 3, 4];
          await Promise.all(
            hazardValues.map(async (value) => {
              // Filter features based on hazard value
              const filteredFeatures = hazardData?.filter(
                (feature: { a31a_205: number }) => feature?.a31a_205 == value
              );

              if (filteredFeatures?.length > 0) {
                // Create a custom config for this hazard level
                const hazardLevelConfig = {
                  id: `hazard-${value}`,
                  style: {
                    ...layerConfigs.hazard.style,
                    paint: {
                      ...layerConfigs.hazard.style.paint,
                      "fill-color": hazardColors[value],
                    },
                  },
                  beforeId: layerConfigs.hazard.beforeId,
                };

                // Add this hazard level layer
                await addStyledLayer(
                  mapInstance?.current,
                  hazardLevelConfig,
                  filteredFeatures,
                  selectedTab
                );
              }
            })
          );
        }
        return hazardData;
      })
      .catch((error) => {
        console.error("Error loading Hazard Layers:", error);
      });

    // Process each of the regular promises
    promises.forEach(({ promise, config }) => {
      promise.then((result) => {
        // Add layer to map as soon as data is available
        if (mapInstance.current && result?.length > 0) {
          addStyledLayer(mapInstance.current, config, result, selectedTab);
        }
        return result;
      });
    });
  };

  useEffect(() => {
    if (projectId && mapInstance.current) {
      fetchAllLayers();
    }
  }, [projectId, mapInstance, basemap, currentUsageType]);

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

  const onRegionPolygonClick = useCallback(
    async (
      region: Park | LandUseRegion | null,
      regionType: "park" | "landUseRegion"
    ) => {
      if (region?.geom) {
        setDraftParkRegionLoading(true);
        try {
          const response = await draftAoi({
            geom: region.geom,
            aoi_type: 2,
            project_id: projectId || "",
            region_id: region.properties?.id.toString(),
          });

          if (response.success) {
            if (regionType === "landUseRegion") {
              dispatch(
                setSelectedLandUseRegion([
                  ...(selectedLandUseRegion ?? []),
                  region,
                ])
              );
            } else {
              dispatch(setSelectedPark([...(selectedPark ?? []), region]));
            }
            if (projectId && savedAoi?.aoi_type === selectedAoi) {
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
          setDraftParkRegionLoading(false);
        }
      }
    },
    [
      dispatch,
      fetchAndSetAoiStats,
      handleSetAlert,
      currentUsageType?.value,
      projectId,
      savedAoi?.aoi_type,
      selectedAoi,
      selectedPark,
      selectedLandUseRegion,
      t,
    ]
  );

  const handleRegionPolygonClick = useCallback(
    async (
      e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }
    ) => {
      const feature = e.features?.[0];
      if (
        !feature ||
        selectedAoi !== 2 ||
        !currentUsageType ||
        (!landUseRegionUsageTypes.includes(currentUsageType.value) &&
          !parkUsageTypes.includes(currentUsageType.value))
      )
        return;

      let regionType: "park" | "landUseRegion" = "park";
      if (landUseRegionUsageTypes.includes(currentUsageType.value))
        regionType = "landUseRegion";
      const regionId = Number(feature.properties?.id);
      const geom = feature.geometry;

      // Find full data for this park if available
      const data = parksDatas?.find(
        (value) => value.properties?.id === regionId
      );
      const regionGeom = data && data.geom ? data.geom : geom;

      const region: Park | LandUseRegion = {
        geom: regionGeom,
        properties: { id: regionId },
      };
      // ✅ Check if the park is already selected
      let isAlreadySelected = null;
      if (regionType === "landUseRegion") {
        isAlreadySelected = selectedLandUseRegion?.some(
          (p) => Number(p.properties?.id) === regionId
        );
      } else {
        isAlreadySelected = selectedPark?.some(
          (p) => Number(p.properties?.id) === regionId
        );
      }

      if (isAlreadySelected) {
        // Remove AOI from backend
        try {
          setRemovingRegionLoading(true);
          const response = await removeAoi(projectId || "", {
            aoi_type: 2,
            regionId: regionId,
          });

          if (response.success) {
            // Update selected parks state
            if (regionType === "landUseRegion") {
              const updatedSelectedLandUseRegion =
                selectedLandUseRegion?.filter(
                  (p) => Number(p.properties?.id) !== regionId
                );
              dispatch(
                setSelectedLandUseRegion(updatedSelectedLandUseRegion || [])
              );
            } else {
              const updatedSelectedParks = selectedPark?.filter(
                (p) => Number(p.properties?.id) !== regionId
              );
              dispatch(setSelectedPark(updatedSelectedParks || []));
            }
            if (selectedAoi === savedAoi?.aoi_type && projectId) {
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
            fetchAndSetAoiStats("2");
          } else {
            console.warn("Failed to remove region:", response.message);
          }
        } catch (err) {
          console.error("Error removing AOI:", err);
        } finally {
          setRemovingRegionLoading(false);
        }
      } else {
        onRegionPolygonClick(region, regionType);
      }
    },
    [
      dispatch,
      onRegionPolygonClick,
      parksDatas,
      projectId,
      selectedAoi,
      selectedPark,
      currentUsageType,
      handleSetAlert,
      selectedLandUseRegion,
      savedAoi?.aoi_type,
      t,
    ]
  );

  const attachRegionLayerClickHandler = useCallback(
    (map: mapboxgl.Map, layerId: string) => {
      const mouseEnterEvent = () => (map.getCanvas().style.cursor = "pointer");
      const mouseLeaveEvent = () => (map.getCanvas().style.cursor = "");

      // ✅ Always remove previous listeners before re-attaching
      map.off("click", layerId, handleRegionPolygonClick);
      map.off("mouseenter", layerId, mouseEnterEvent);
      map.off("mouseleave", layerId, mouseLeaveEvent);

      // // ✅ Attach handlers only once
      map.on("click", layerId, handleRegionPolygonClick);
      map.on("mouseenter", layerId, mouseEnterEvent);
      map.on("mouseleave", layerId, mouseLeaveEvent);
    },
    [handleRegionPolygonClick]
  );

  //attach the click event for park layer
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !currentUsageType) return;
    if (parkUsageTypes.includes(currentUsageType.value)) {
      attachRegionLayerClickHandler(map, "layer-parkLayer");
    } else if (landUseRegionUsageTypes.includes(currentUsageType.value)) {
      attachRegionLayerClickHandler(map, "layer-landUseRegion");
    }
    return () => {
      map.off("click", "layer-parkLayer", handleRegionPolygonClick);
      map.off("click", "layer-landUseRegion", handleRegionPolygonClick);
    };
  }, [
    attachRegionLayerClickHandler,
    handleRegionPolygonClick,
    currentUsageType,
  ]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !projectId || !currentUsageType) return;
    const addParkOrLandUseRegionLayerToMap = async (
      data: Parks | LandUseRegions,
      layerConfig: LayerConfig
    ) => {
      try {
        await addStyledLayer(map, layerConfig, data, selectedTab, selectedAoi);
      } catch (error) {
        console.error(error);
        handleSetAlert(t("app.serverErrorMessage"), "error");
      }
    };
    if (parkUsageTypes.includes(currentUsageType?.value) && parksDatas) {
      addParkOrLandUseRegionLayerToMap(parksDatas, layerConfigs.parkLayer);
    } else if (
      landUseRegionUsageTypes.includes(currentUsageType?.value) &&
      landUseRegions
    ) {
      addParkOrLandUseRegionLayerToMap(
        landUseRegions,
        layerConfigs.landUseRegion
      );
    }
  }, [
    currentUsageType,
    parksDatas,
    landUseRegions,
    handleSetAlert,
    projectId,
    selectedAoi,
    selectedTab,
    t,
  ]);

  //fetch park data
  useEffect(() => {
    const fetchParkDatas = async () => {
      try {
        setFetchParksLoading(true);
        const parksData = await fetchParks();
        setParksDatas(parksData);
      } catch (error) {
        console.error(error);
        handleSetAlert(t("app.serverErrorMessage"), "error");
      } finally {
        setFetchParksLoading(false);
      }
    };
    if (
      projectId &&
      currentUsageType &&
      parkUsageTypes.includes(currentUsageType?.value)
    ) {
      fetchParkDatas();
    } else {
      setParksDatas(null);
    }
  }, [currentUsageType, handleSetAlert, projectId, t]);

  //fetch land use region data
  useEffect(() => {
    const fetchLandUseRegionData = async () => {
      try {
        setFetchLandUseRegionLoading(true);
        const landUseRegions = await fetchLandUseRegions();
        setLandUseRegions(landUseRegions);
      } catch (error) {
        console.error(error);
        handleSetAlert(t("app.serverErrorMessage"), "error");
      } finally {
        setFetchLandUseRegionLoading(false);
      }
    };
    if (
      projectId &&
      currentUsageType &&
      landUseRegionUsageTypes.includes(currentUsageType.value)
    ) {
      fetchLandUseRegionData();
    } else {
      setLandUseRegions(null);
    }
  }, [currentUsageType, handleSetAlert, projectId, t]);

  useEffect(() => {
    if (!mapInstance.current) return;

    const map = mapInstance.current;

    // Function to handle visibility configuration
    const applyVisibilityConfig = () => {
      // Determine which visibility configuration to use based on selectedTab
      let visibilityConfig;
      switch (selectedTab) {
        case "aoi":
          visibilityConfig = aoiLayerVisibility;
          break;
        case "simulation":
          visibilityConfig = simulationLayerVisibility;
          break;
        case "result":
          visibilityConfig = resultLayerVisibility;
          break;
        default:
          return; // Exit if tab is not recognized
      }

      // Apply visibility settings from the configuration object
      Object.entries(visibilityConfig).forEach(([layerId, isVisible]) => {
        if (map.getLayer(layerId)) {
          if (["layer-parkLayer", "layer-landUseRegion"].includes(layerId)) {
            isVisible =
              selectedAoi === 2 && selectedTab === "aoi" ? true : false;
          }
          map.setLayoutProperty(
            layerId,
            "visibility",
            isVisible ? "visible" : "none"
          );
        }
      });
    };

    // Always use the 'idle' event to ensure the map is ready
    const onIdle = () => {
      applyVisibilityConfig();
      map.off("idle", onIdle); // Remove the listener after execution
    };

    // Register the event
    map.on("idle", onIdle);
  }, [selectedTab, basemap, projectId, selectedAoi]);

  //results logic here below
  const fetchPointAndPolygonResults = useCallback(async () => {
    if (projectId) {
      const pointResults = await fetchProjectPointResult(projectId);
      const polygonResults = await fetchProjectPolygonResult(projectId);
      setPointResults(pointResults);
      setPolygonResults(polygonResults);
    }
  }, [projectId]);

  useEffect(() => {
    const handleMapLayers = async () => {
      const map = mapInstance.current;

      if (!map) {
        console.error("Map instance is not initialized.");
        return;
      }

      const ensureStyleIsLoaded = () => {
        return new Promise<void>((resolve) => {
          if (map.isStyleLoaded()) {
            resolve();
          } else {
            const onStyleLoad = () => {
              map.off("styledata", onStyleLoad);
              resolve();
            };
            map.on("styledata", onStyleLoad);
          }
        });
      };

      try {
        await ensureStyleIsLoaded();

        if (selectedTab === "result") {
          if (pointResults.length > 0) {
            const pointConfig = createRainGardenLayerConfig();
            const pointData = pointResults.map((point) => ({
              ...point,
              properties: {
                raingarden_type: point.raingarden_type,
              },
            }));
            await addStyledLayer(map, pointConfig, pointData, selectedTab);
          }

          if (polygonResults.length > 0) {
            const polygonConfig = createHabitatLayerConfig();
            const polygonData = polygonResults.map((polygon) => ({
              ...polygon,
              properties: {
                habitat_type: polygon.habitat_type,
              },
            }));
            await addStyledLayer(map, polygonConfig, polygonData, selectedTab);
          }
        } else {
          await removeStyledLayer(map, LAYER_IDS.RAINGARDEN);
          await removeStyledLayer(map, LAYER_IDS.HABITAT);
        }
      } catch (error) {
        console.error("Error managing map layers:", error);
      }
    };

    handleMapLayers();
  }, [selectedTab, pointResults, polygonResults, basemap]);

  useEffect(() => {
    if (selectedTab === "result") {
      fetchPointAndPolygonResults();
    }
  }, [fetchPointAndPolygonResults, projectId, selectedTab, basemap]);

  return (
    <>
      {loading && <Loader text={t(loadingText)} />}
      {alert.open && (
        <AlertBox
          open={alert.open}
          onClose={() => setAlert({ ...alert, open: false })}
          message={alert.message}
          severity={alert.severity}
        />
      )}
      {/* modal for selecting simulation type */}
      <Modal
        open={dialogOpen}
        onClose={handleDialogClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <StyledBox>
          <Typography
            id="modal-modal-title"
            variant="h6"
            component="h2"
            sx={{ mb: 2, color: "primary.main" }}
          >
            {t("app.selectRGType")}
          </Typography>

          <RainTypeDropDown<RainGardenOption>
            options={filteredRainGardenOptions}
            onSelect={handleRainGardenTypeChange}
            onSubSelect={handleRainGardenSubTypeChange}
            label={t("app.RGType")}
            value={selectedRainGardenType}
            subValue={selectedSubRainGardenType}
            getOptionLabel={(option) => option.label}
            getOptionValue={(option) => option.value}
            hasSubOptions={hasSubOptions}
            getSubOptions={getSubOptions}
            id="rain-garden-type-dropdown"
            className="mb-4"
          />

          <Box
            sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}
          >
            <Button
              onClick={handleDialogClose}
              variant="outlined"
              color="primary"
            >
              {t("app.cancel")}
            </Button>
            <Button
              onClick={handleSimulationPolygonTypeConfirmation}
              variant="contained"
              color="primary"
              disabled={!selectedRainGardenType || shapeSavingLoading}
            >
              {shapeSavingLoading ? t("app.processing") : t("app.confirm")}
            </Button>
          </Box>
        </StyledBox>
      </Modal>

      {/* Wrapper div to contain both map and legend */}
      <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
        {/* Map container */}
        <Box
          ref={mapContainerRef}
          sx={{
            width: "100%",
            height: "100%",
            ...sx,
          }}
        />
        {/* Legend rendered outside the map container but positioned over it */}
        {
          <Legend
            map={mapInstance.current}
            selectedTab={selectedTab}
            selectedAoi={selectedAoi}
          />
        }
        {draftParkRegionLoading && (
          <Loader text={t("app.draftingRegionLoadingText")} />
        )}
        {fetchParksLoading && (
          <Loader text={t("app.parksFetchingLoadingText")} />
        )}
        {fetchLandUseRegionLoading && (
          <Loader text={t("app.landUseRegionFetchingLoadingText")} />
        )}
        {removingRegionLoading && (
          <Loader text={t("app.removingRegionLoadingText")} />
        )}
      </Box>
    </>
  );
};

export default Map;
