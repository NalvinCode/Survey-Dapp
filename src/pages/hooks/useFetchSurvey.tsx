import axios from "axios"
import AxiosResponse from "axios"
import { useState } from "react"

const baseURL = ""

const useFetchSurvey = async() => {
    const [survey, setSurvey] = useState<Survey | null>(null)
    axios.get<Survey>('http://localhost:8080/admin/users')
        .then(response => {
            setSurvey( response.data );
        });
    return survey;
}

export default useFetchSurvey;