import { Geometry } from "@/types/Region";
import { validatePolygonArea } from "@/utils/validatePolygonArea";
import { validateGeometryOverlap } from "@/utils/validateGeometryOverlap";
import { adjustLineString } from "@/utils/map/lineLengthHelper";
import { LENGTH_INCREMENT, MAX_AREA_SQ_M } from "@/constants/numberConstants";
import { addMidpoints } from "@/utils/map/addMidPoints";
import { cleanupLineDrawing } from "@/utils/map/lineInputPopoverHandler";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import { AppDispatch } from "@/redux/store";
import { 
  updateShape, 
  deleteShape, 
  saveAoi,
  fetchSavedAoiThunk,
  removeAoi,
} from "@/api/project";
import { setSelectedAoiPolygonGeom } from "@/redux/slices/selectedAoiSlice";
import { AlertColor } from "@mui/material";
import { fetchAOIStatistics } from "@/api/lookup";
import { resetSavedAoi } from "@/redux/slices/savedAoi";
import { TFunction } from "i18next";
import { validatePolygonGeometry } from "../validatePolygonGeometry";
import { UsageType } from "@/types/UsageType";

export interface DrawCreateHandlerParams {
  event: MapboxDraw.DrawCreateEvent;
  selectedTab: string;
  projectId: string;
  drawInstance: React.MutableRefObject<MapboxDraw | null>;
  dispatch: AppDispatch;
  t: TFunction;
  handleSetAlert: (message: string, severity: AlertColor) => void;
  setLoading: (loading: boolean) => void;
  setLoadingText: (text: string) => void;
  setSimulationPolygon: (polygon: GeoJSON.Feature<GeoJSON.Geometry> | null) => void;
  setDialogOpen: (open: boolean) => void;
  setPolygonDraftAoi: (geometry: Geometry | null) => void;
  saveDraftAoi: (geometry: Geometry) => Promise<void>;
}

export interface DrawUpdateHandlerParams {
  event: MapboxDraw.DrawUpdateEvent;
  selectedTab: string;
  projectId: string;
  drawInstance: React.MutableRefObject<MapboxDraw | null>;
  mapInstance: React.MutableRefObject<mapboxgl.Map | null>;
  dispatch: AppDispatch;
  t: TFunction;
  handleSetAlert: (message: string, severity: AlertColor) => void;
  setLoading: (loading: boolean) => void;
  setLoadingText: (text: string) => void;
  latestPolygonRef: React.MutableRefObject<Geometry | null>;
  selectedShapeRef: React.MutableRefObject<Geometry | null>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lineDrawingStateRef: React.MutableRefObject<any>;
  mouseMoveHandlerRef: React.MutableRefObject<((e: mapboxgl.MapMouseEvent) => void) | null>;
  saveDraftAoi: (geometry: Geometry) => Promise<void>;
  selectedAoi: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  savedAoi: any;
  usageType: string | null;
  currentUsageType:UsageType | null
}

export interface DrawDeleteHandlerParams {
  event: MapboxDraw.DrawDeleteEvent;
  selectedTab: string;
  projectId: string;
  drawInstance: React.MutableRefObject<MapboxDraw | null>;
  mapInstance: React.MutableRefObject<mapboxgl.Map | null>;
  dispatch: AppDispatch;
  t: TFunction;
  handleSetAlert: (message: string, severity: AlertColor) => void;
  setLoading: (loading: boolean) => void;
  setLoadingText: (text: string) => void;
  setPolygonDraftAoi: (geometry: Geometry | null) => void;
}

const detectEditedVertex = (oldCoords: number[][], newCoords: number[][]): number | null => {
  for (let i = 0; i < oldCoords.length; i++) {
    if (JSON.stringify(oldCoords[i]) !== JSON.stringify(newCoords[i])) {
      return i;
    }
  }
  return null;
};

export const handleDrawCreate = async (params: DrawCreateHandlerParams) => {
  const {
    event,
    selectedTab,
    projectId,
    drawInstance,
    dispatch,
    t,
    handleSetAlert,
    setSimulationPolygon,
    setDialogOpen,
    setPolygonDraftAoi,
    saveDraftAoi
  } = params;

  const drawnFeature = event.features[0];
  const geometry = event.features[0].geometry;
  const featureId = event.features[0].id;

  if (selectedTab === "simulation") {
    // First check for overlaps
    const existingFeatures = drawInstance.current?.getAll()?.features || [];
    const overlapValidation = validateGeometryOverlap(geometry, featureId, existingFeatures, t);

    if (!overlapValidation.isValid) {
      if (featureId) drawInstance.current?.delete(featureId as string);
      if (overlapValidation.message) handleSetAlert(overlapValidation.message, "error");
      return;
    }
    
    // Handle both points and polygons for simulation
    if (geometry.type === 'Polygon') {
      // Self-intersection validation
      const isValidPolygon = validatePolygonGeometry(drawnFeature);

      if (!isValidPolygon) {
        if (featureId) drawInstance.current?.delete(featureId as string);
        handleSetAlert(t("app.invalidPolygonMessage"), "error");
        return;
      }

      const validation = validatePolygonArea(geometry);
      if (!validation.isValid) {
        const errorMessage = t("app.polygon_area_exceeds", {
          area: validation.area.toFixed(2),
          maxArea: MAX_AREA_SQ_M,
        });
        if (featureId) {
          drawInstance?.current?.delete(featureId as string);
        }
        handleSetAlert(errorMessage, "error");
        return;
      }
    } else if (geometry.type === "LineString") {
      const { adjustedGeometry, originalLength, updatedLength } =
        adjustLineString(geometry);

      if (drawInstance.current && featureId) {
        // Delete the original line
        drawInstance.current.delete(featureId as string);

        // Add the adjusted line to the map
        const updatedFeature: GeoJSON.Feature<GeoJSON.Geometry> = {
          type: "Feature",
          id: featureId,
          properties: {},
          geometry: adjustedGeometry,
        };

        drawInstance.current.add(updatedFeature);
        // Show adjustment notification immediately
        if (originalLength !== updatedLength) {
          handleSetAlert(
            t('app.lineAdjusted', { 
              original: originalLength, 
              updated: updatedLength,
              increment: LENGTH_INCREMENT 
            }),
            "info"
          );
        }

        // Store the updated shape for later use
        setSimulationPolygon(updatedFeature);
        
        if (featureId) {
          drawInstance.current?.delete(featureId as string);
        }
        setDialogOpen(true);
        
        return;
      }
    }
    
    setSimulationPolygon(event.features[0]);
    setDialogOpen(true);
    if (featureId) {
      drawInstance?.current?.delete(featureId as string);
    }
  } else if (selectedTab === "aoi") {
    // AOI only allows polygons
    if (geometry.type !== 'Polygon') {
      if (featureId) {
        drawInstance?.current?.delete(featureId as string);
      }
      return;
    }
    // Self-intersection validation
    const isValidPolygon = validatePolygonGeometry(drawnFeature);

    if (!isValidPolygon) {
      if (featureId) drawInstance.current?.delete(featureId as string);
      handleSetAlert(t("app.invalidPolygonMessage"), "error");
      return;
    }

    const validation = validatePolygonArea(geometry);
    if (!validation.isValid) {
      const errorMessage = t("app.polygon_area_exceeds", {
        area: validation.area.toFixed(2),
        maxArea: MAX_AREA_SQ_M,
      });
      if (featureId) {
        drawInstance?.current?.delete(featureId as string);
      }
      handleSetAlert(errorMessage, "error");
      return;
    }

    await saveDraftAoi(geometry);
    dispatch(setSelectedAoiPolygonGeom(geometry));
    if (projectId) dispatch(fetchAOIStatistics({ projectId, aoiType: "1" }));

    setPolygonDraftAoi(geometry);
  }
};

export const handleDrawUpdate = async (params: DrawUpdateHandlerParams) => {
  const {
    event,
    selectedTab,
    projectId,
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
    usageType,
    currentUsageType
  } = params;

  try {
    const feature = event.features[0];
    const geometry = feature.geometry;

    // Create a deep copy of the geometry to work with
    let updatedGeometry = JSON.parse(JSON.stringify(geometry)) as Geometry;

    if ((selectedTab === "aoi" || selectedTab === "simulation") && geometry.type === "Polygon") {
      const isValidPolygon = validatePolygonGeometry(feature);

      if (!isValidPolygon && drawInstance.current) {        
        if(selectedTab === "simulation" && selectedShapeRef.current){
          drawInstance.current.delete(feature.id as string);
          const originalFeature: GeoJSON.Feature<GeoJSON.Geometry> = {
            type: "Feature",
            id: feature.id as string,
            properties: {},
            geometry: selectedShapeRef.current,
          };
          drawInstance.current.add(originalFeature);
        }else if(selectedTab === "aoi" && latestPolygonRef.current){
          drawInstance.current.delete(feature.id as string);

          const originalFeature: GeoJSON.Feature<GeoJSON.Polygon> = {
            type: "Feature",
            id: "draft-aoi",
            properties: {},
            geometry: latestPolygonRef.current as GeoJSON.Polygon,
          };

          drawInstance.current.add(originalFeature);
        }
        
        handleSetAlert(t("app.invalidPolygonMessage"), "error");
        return;
      }
    }

    if (selectedTab === "simulation" && geometry.type === "LineString") {
      // Cleanup any existing popups and mousemove handlers
      if (mapInstance.current) {
        cleanupLineDrawing(lineDrawingStateRef, mapInstance?.current, mouseMoveHandlerRef.current);
        mouseMoveHandlerRef.current = null;
      }

      // Pass the original geometry from selectedShapeRef for comparison
      const { adjustedGeometry, originalLength, updatedLength } =
        adjustLineString(geometry, selectedShapeRef.current || undefined);

      // Update the geometry with the adjusted version
      updatedGeometry = adjustedGeometry;
      
      // Show info alert about the adjustment
      if (Math.abs(originalLength - updatedLength) > 0.01) {
        handleSetAlert(
          t('app.lineAdjusted', { 
            original: originalLength, 
            updated: updatedLength,
            increment: LENGTH_INCREMENT 
          }),
          "info"
        );
      }
    }

    // Only handle midpoints for polygons
    if (geometry.type === 'Polygon') {
      const editedCoordinates = geometry.coordinates[0];
      let lastEditedIndex = null;

      if (latestPolygonRef.current && selectedTab === "aoi" && latestPolygonRef.current.type === 'Polygon') {
        lastEditedIndex = detectEditedVertex(latestPolygonRef.current.coordinates[0], editedCoordinates);
      } else if (selectedShapeRef.current && selectedTab === "simulation" && selectedShapeRef.current.type === 'Polygon') {
        lastEditedIndex = detectEditedVertex(selectedShapeRef.current.coordinates[0], editedCoordinates);
      }

      // Add midpoints only for polygons
      (updatedGeometry as GeoJSON.Polygon).coordinates[0] = addMidpoints(editedCoordinates, lastEditedIndex);
    }

    if (selectedTab === "simulation") {
      const existingFeatures = drawInstance.current?.getAll()?.features || [];
      const overlapValidation = validateGeometryOverlap(updatedGeometry, feature.id, existingFeatures, t);

      if (!overlapValidation.isValid) {
        if (overlapValidation.message) handleSetAlert(overlapValidation.message, "error");
        
        // Revert to original geometry
        if (drawInstance.current && selectedShapeRef.current) {
          drawInstance.current.delete(feature.id as string);
          const originalFeature: GeoJSON.Feature<GeoJSON.Geometry> = {
            type: "Feature",
            id: feature.id as string,
            properties: {},
            geometry: selectedShapeRef.current,
          };
          drawInstance.current.add(originalFeature);
        }
        return;
      }

      if (projectId) {
        setLoading(true);
        setLoadingText(t("app.shapeUpdatingMessage"));
        const response = await dispatch(
          updateShape({
            project_id: projectId,
            shape_id: feature.id as string,
            geom: updatedGeometry,
          })
        );

        if (response) {
          handleSetAlert(t("app.shapeUpdateSuccessMessage"), "success");
          if (drawInstance?.current) {
            drawInstance.current.delete(feature.id as string);

            const updatedShape: GeoJSON.Feature<GeoJSON.Geometry> = {
              type: "Feature",
              id: feature.id as string,
              properties: {},
              geometry: updatedGeometry,
            };

            drawInstance.current.add(updatedShape);
          }
        } else {
          handleSetAlert(t("app.shapeUpdateFailedMessage"), "error");
        }
      }
    } else if (selectedTab === "aoi") {
      if (usageType === 'road_planning') {        
        // If user tried to drag or reshape polygon → revert to previous geometry
        if ((geometry.type === 'Polygon' || geometry.type === "MultiPolygon")  && latestPolygonRef.current) {
          if (drawInstance.current) {
            drawInstance.current.delete(feature.id as string);

            const restoredFeature: GeoJSON.Feature<GeoJSON.Polygon> = {
              type: "Feature",
              id: feature.id as string,
              properties: feature.properties || {},
              geometry: latestPolygonRef.current as GeoJSON.Polygon,
            };

            drawInstance.current.add(restoredFeature);
          }

          handleSetAlert(t("app.editingDisabledMessage"), "info");
        }

        return; 
      }

      // For AOI, we only handle polygons
      if (geometry.type !== 'Polygon') {
        handleSetAlert(t("app.aoiOnlySupportsPolygons"), "error");
        return;
      }

      const validation = validatePolygonArea(geometry);
      if (!validation.isValid) {
        const errorMessage = t("app.polygon_area_exceeds", {
          area: validation.area.toFixed(2),
          maxArea: MAX_AREA_SQ_M,
        });

        if (drawInstance?.current) {
          drawInstance.current.delete(feature.id as string);

          const originalFeature: GeoJSON.Feature<GeoJSON.Polygon> = {
            type: "Feature",
            id: "draft-aoi",
            properties: {},
            geometry: latestPolygonRef.current as GeoJSON.Polygon,
          };

          drawInstance.current.add(originalFeature);
        }

        handleSetAlert(errorMessage, "error");
        return;
      }

      await saveDraftAoi(updatedGeometry);
      dispatch(setSelectedAoiPolygonGeom(updatedGeometry));

      if (projectId) {
        if (selectedAoi === savedAoi?.aoi_type) {
          const saveResponse = await saveAoi(projectId, {aoi_type:selectedAoi,usage_type:currentUsageType?.value || ""});
          if (saveResponse.success) {
            handleSetAlert(t("app.aoiSaveSuccessMessage"), "success");
            dispatch(fetchSavedAoiThunk(projectId));
          } else {
            handleSetAlert(t("app.aoiSaveFailedMessage"), "error");
          }
        }
        dispatch(fetchAOIStatistics({ projectId, aoiType: "1" }));
      }

      if (mapInstance.current && updatedGeometry.type === 'Polygon') {
        const bounds = new mapboxgl.LngLatBounds();
        updatedGeometry.coordinates[0].forEach((coord) => {
          bounds.extend(coord as mapboxgl.LngLatLike);
        });

        if (!bounds.isEmpty()) {
          mapInstance.current.fitBounds(bounds, {
            padding: 50,
            duration: 500,
          });
        }
      }
    }
  } catch (error) {
    console.error("Error updating geometry:", error);
    handleSetAlert(t("app.shapeUpdateCatchError"), "error");
  } finally {
    setLoading(false);
    setLoadingText("");
  }
};

export const handleDrawDelete = async (params: DrawDeleteHandlerParams) => {
  const {
    event,
    selectedTab,
    projectId,
    drawInstance,
    mapInstance,
    dispatch,
    t,
    handleSetAlert,
    setLoading,
    setLoadingText,
    setPolygonDraftAoi
  } = params;

  try {
    if (selectedTab === "simulation") {
      if (projectId) {
        setLoading(true);
        setLoadingText(t("app.deletingShapeMessage"));
        const response = await dispatch(
          deleteShape({
            project_id: projectId,
            shape_id: event?.features[0]?.id as string,
          })
        );
        if (response) {
          drawInstance.current?.delete(event?.features[0]?.id as string);
          handleSetAlert(t("app.shapeDeletionSuccessMessage"), "success");
        } else {
          handleSetAlert(t("app.shapeDeletionFailedMessage"), "error");
        }
      }
    } else if (selectedTab === "aoi") {
      setLoading(true);
      setLoadingText(t("app.polygonDeletingLoadingText"));
      const response = await removeAoi(projectId || "", { aoi_type: 1 });
      if (response.success) {
        // Clear the draft AOI state
        setPolygonDraftAoi(null);
        dispatch(setSelectedAoiPolygonGeom(null));
        
        handleSetAlert(t("app.polygonDeletedSuccessfully"), "success");
        dispatch(resetSavedAoi());

        if (projectId) dispatch(fetchAOIStatistics({ projectId, aoiType: "1" }));
        // Clear draw tool
        drawInstance.current?.deleteAll();
        drawInstance.current?.changeMode("simple_select");

        // Remove polygon from the map
        const map = mapInstance.current;
        if (map) {
          if (map.getLayer("selectedRegionLayer")) {
            map.removeLayer("selectedRegionLayer");
          }
          if (map.getSource("selectedRegion")) {
            map.removeSource("selectedRegion");
          }
        }
      } else {
        handleSetAlert(t("app.errorDeletingPolygon"), "error");
      }
    }
  } catch (error) {
    console.error("Error deleting polygon: ", error);
    handleSetAlert(t("app.shapeDeletionCatchError"), "error");
  } finally {
    setLoading(false);
    setLoadingText("");
  }
};