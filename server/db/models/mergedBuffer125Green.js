import { DataTypes } from "sequelize";
import { sequelize } from "../../config/dbConfig.js";


export const MergedBuffer125Green = sequelize.define(
  "buffer125_merged_green",
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
    uid: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    geom: {
      type: DataTypes.GEOMETRY("MULTIPOLYGON", 4326),
      allowNull: false,
    },
    properties: {
      type: DataTypes.JSONB,
      allowNull: true,
    }
  }, {
    tableName: "buffer125_merged_green",
    schema: "processing",
    timestamps: false,
  }
);