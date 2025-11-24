import { DataTypes } from "sequelize";
import sequelize from "../../config/dbConfig.js";

export const ProjectPolygons = sequelize.define(
  "project_polygons",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    project_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "projects",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    polygon_index: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    geom: {
      type: DataTypes.GEOMETRY("POLYGON", 4326),
      allowNull: false,
    },
    area_m2: {
      type: DataTypes.DECIMAL,
      allowNull: true,
    },
    perimeter_m: {
      type: DataTypes.DECIMAL,
      allowNull: true,
    }, 
  }, 
  {
    tableName: "project_polygons",
    timestamps: true,
    underscored: true,
  }
);