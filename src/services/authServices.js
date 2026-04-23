const API = "https://sistema-planeacion-production.up.railway.app/api"

export async function login(email,password){

const response = await fetch(`${API}/auth/login`,{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body: JSON.stringify({
email,
password
})
})

const data = await response.json()

localStorage.setItem("token",data.token)

return data
}
export async function getMe(){

const token = localStorage.getItem("token")

const response = await fetch("https://sistema-planeacion-production.up.railway.app/api/auth/me",{
method:"GET",
headers:{
Authorization: `Bearer ${token}`
}
})

return await response.json()
}