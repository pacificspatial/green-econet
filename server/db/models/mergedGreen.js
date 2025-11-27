import { DataTypes } from "sequelize";
import { sequelize } from "../../config/dbConfig.js";

export const MergedGreen = sequelize.define(
  "merged_green",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    project_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: {
          tableName: "projects",
          schema: "public",
        },
        key: "id",
      },
      onDelete: "CASCADE",
    },
    src_type: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    src_ref: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    geom: {
      type: DataTypes.GEOMETRY("MULTIPOLYGON", 4326),
      allowNull: false,
    },
    properties: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    uid: {
      type: DataTypes.UUID,
      allowNull: true
    },
  }, {
    tableName: "merged_green",
    schema: "processing",
    timestamps: false,
  }
);