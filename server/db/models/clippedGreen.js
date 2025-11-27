import { DataTypes } from "sequelize";
import { sequelize } from "../../config/dbConfig.js";


export const ClippedGreen = sequelize.define(
  "clipped_green",
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

    src_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
  },
  {
    tableName: "clipped_green",
    schema: "processing",
    timestamps: false,
  }
);