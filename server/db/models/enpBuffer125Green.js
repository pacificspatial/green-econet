import { DataTypes } from "sequelize";
import sequelize from "../../config/dbConfig.js";

export const EnpBuffer125Green = sequelize.define(
  "enp_buffer125_green",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    properties: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    geom: {
      type: DataTypes.GEOMETRY,
      allowNull: false,
    },
  },
  {
    tableName: "enp_buffer125_green",
    schema: "layers",
    timestamps: false,
  }
);
