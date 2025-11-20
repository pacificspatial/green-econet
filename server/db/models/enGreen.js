import { DataTypes } from "sequelize";
import sequelize from "../../config/dbConfig.js";

const EnGreen = sequelize.define(
  "en_green",
  {
    cartodb_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    geom: {
      type: DataTypes.GEOGRAPHY,
      allowNull: true,
    },
    w05_001: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    w05_002: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    w05_003: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    w05_004: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    w05_005: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    w05_006: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
  },
  {
    tableName: "en_green",
    timestamps: false,
  }
);

export default EnGreen;
