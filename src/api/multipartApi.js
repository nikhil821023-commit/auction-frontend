import axios from 'axios'

const multipartApi = axios.create({
  baseURL: 'http://localhost:8080/api',  // ← ADD /api here
  headers: {
    'Content-Type': 'multipart/form-data'
  }
})

export default multipartApi