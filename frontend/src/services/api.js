import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

export const getDetections = async () => {
  const res = await API.get("/detections");
  return res.data;
};

export const getLiveDetection = async () => {
  const res = await API.get("/detections/live");
  return res.data;
};

export const simulateDetections = async () => {
  const res = await API.get("/detections/simulate");
  return res.data;
};

export const getSensors = async () => {
  const res = await API.get("/sensors");
  return res.data;
};

export const acknowledgeDetection = async (id, operator) => {
  const res = await API.patch(`/detections/${id}/acknowledge`, {
    operator,
  });
  return res.data;
};

export const clearDetections = async () => {
  const res = await API.delete("/detections");
  return res.data;
};