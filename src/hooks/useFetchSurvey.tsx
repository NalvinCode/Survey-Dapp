import axios from "axios";

const baseURL = "http://localhost:3000/database/survey.json";

export const useFetchSurvey = async () => {
  let data = await axios.get<any>(`${baseURL}`);
  return data.data;
};
