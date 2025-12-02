// src/components/maps/Legend.tsx
import type maplibregl from "maplibre-gl";

import { moveDrawLayersToTop } from "@/utils/draw/moveDrawLayers";
import { Box, IconButton, Switch, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { layerColors } from "@/constants/layerConstants";
import type { Theme } from "@mui/system";

interface LegendProps {
  map: maplibregl.Map | null;
  theme: Theme;
}

const Legend: React.FC<LegendProps> = ({ map, theme }) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);

  const defaultLegendStates = {
    green: true,
    bufferGreen: true,
  };

  const [visibleLayers, setVisibleLayers] = useState<Record<string, boolean>>(
    () => defaultLegendStates
  );

  useEffect(() => {
    setVisibleLayers(defaultLegendStates);

    Object.keys(defaultLegendStates).forEach((layerId) => {
      const layerName = `layer-${layerId}`;
      if (map?.getLayer(layerName)) {
        map.setLayoutProperty(layerName, "visibility", "visible");
      }
    });
  }, [map]);

  const toggleLayer = (layerId: string) => {
    setVisibleLayers((prev) => {
      const newVisibleLayers = { ...prev };
      const newState = !prev[layerId];
      newVisibleLayers[layerId] = newState;

      const layerName = `layer-${layerId}`;

      if (map) {
        if (map.isStyleLoaded()) {
          if (map.getLayer(layerName)) {
            map.setLayoutProperty(
              layerName,
              "visibility",
              newState ? "visible" : "none"
            );
          }
        } else {
          map.once("idle", () => {
            if (map.getLayer(layerName)) {
              map.setLayoutProperty(
                layerName,
                "visibility",
                newState ? "visible" : "none"
              );
            }
          });
        }
        moveDrawLayersToTop(map);
      }

      return newVisibleLayers;
    });
  };

  return (
    <Box
      sx={{
        position: "absolute",
        bottom: 20,
        right: 10,
        background: theme.palette.background.paper,
        padding: "10px",
        borderRadius: "8px",
        boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
        maxWidth: "220px",
        width: "fit-content",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography
          variant="h6"
          sx={{ fontSize: "12px", fontWeight: "bold" }}
        >
          {t("app.legendTitle")}
        </Typography>
        <IconButton size="small" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ExpandMore /> : <ExpandLess />}
        </IconButton>
      </Box>

      {expanded && (
        <Box sx={{ mt: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <Switch
              id="green-switch"
              size="small"
              checked={visibleLayers.green}
              onChange={() => toggleLayer("green")}
            />
            <Box
              sx={{
                width: 10,
                height: 10,
                backgroundColor: layerColors.green,
                borderRadius: "3px",
                mr: 1,
              }}
            />
            <Typography variant="body2" sx={{ fontSize: "10px" }}>
              {t("app.green")}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <Switch
              id="bufferGreen-switch"
              size="small"
              checked={visibleLayers.bufferGreen}
              onChange={() => toggleLayer("bufferGreen")}
            />
            <Box
              sx={{
                width: 10,
                height: 10,
                backgroundColor: layerColors.bufferGreen,
                borderRadius: "3px",
                mr: 1,
              }}
            />
            <Typography variant="body2" sx={{ fontSize: "10px" }}>
              {t("app.bufferGreen")}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Legend;
