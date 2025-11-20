import { Attributes } from "@/types/User";
import axiosAPI from "./axiosInstance";

const deleteUser = async (username: string) => {
  try {
    const response = await axiosAPI.delete(`/user/${username}`);
    return response.data;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

const fetchUsers = async () => {
  try {
    const response = await axiosAPI.get("/users");
    return response.data;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

const getUser = async () => {
  const response = await axiosAPI.get(`/user`);
  return response.data;
};

const updateUserAttributes = async (
  username: string,
  attributes: Attributes
) => {
  try {
    const response = await axiosAPI.put(`/user/${username}`, attributes);
    return response.data;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

export { deleteUser, fetchUsers, getUser, updateUserAttributes };
