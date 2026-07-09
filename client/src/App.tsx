import {useState, useEffect} from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'
import './App.css'

interface Vaga {
    id: number;
    titulo: string;
    latitude: number;
    longitude: number;
}

export default function App(){
    const [vagas, setVagas] = useState<Vaga[]>([]);

    useEffect(()=>{
        fetch('http://localhost:8080/api/vaga')
        .then((resposta) => resposta.json())
        .then((dados)=>{
            setVagas(dados)
        })
        .catch((erro) => console.error("Erro ao buscar vagas: ", erro))
    },[])

    const salvadorCentro: [number, number] = [-12.9714, -38.5014];

    return(
        <MapContainer center={salvadorCentro} zoom={12} scrollWheelZoom={true}
        >
        <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {vagas.map((vaga) => (
            <Marker key={vaga.id} position={[vaga.latitude, vaga.longitude]}>
                <Popup>
                    <strong>{vaga.titulo}</strong>
                </Popup>
            </Marker>
        ))}
        </MapContainer>
    )

}