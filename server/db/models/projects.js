import { DataTypes } from "sequelize";
import sequelize from "../../config/dbConfig.js";


export const Projects = sequelize.define(
  "projects",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    config: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    aoi_centroid: {
      type: DataTypes.GEOGRAPHY,
      allowNull: true,
    },
    geom: {
      type: DataTypes.GEOGRAPHY,
      allowNull: true,
    }
  }, {
    tableName: "projects",
    timestamps: true,
    underscored: true,
  }
);