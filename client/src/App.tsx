import {useState, useEffect} from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'
import './App.css'

interface Vaga {
    id: number;
    titulo: string;
    descricao: string;
    empresa: string;
    tipo: string;
    bairro: string;
    latitude: number;
    longitude: number;
}

export default function App(){
    const [vagas, setVagas] = useState<Vaga[]>([]);
    const [vagaSelecionada, setVagaSelecionada] = useState<Vaga | null>(null)


    useEffect(()=>{
        fetch('http://localhost:8080/api/vaga')
        .then((resposta) => resposta.json())
        .then((dados)=>{

            if(Array.isArray(dados)){
                setVagas(dados)
            }
        })
        .catch((erro) => console.error("Erro ao buscar vagas: ", erro))
    },[])

    const salvadorCentro: [number, number] = [-12.9714, -38.5014];

    return(
        <>        <MapContainer center={salvadorCentro} zoom={12} scrollWheelZoom={true}
        >
        <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {vagas.map((vaga) => (
            <Marker 
                key={vaga.id} 
                position={[vaga.latitude, vaga.longitude]}
                eventHandlers={{
                    click: () => setVagaSelecionada(vaga)
                }}
            />
        ))}
        </MapContainer>

       {vagaSelecionada && (
        <>
          <div className="overlay" onClick={() => setVagaSelecionada(null)}></div>

          <div className="bottom-sheet">
            <button className="botao-fechar" onClick={() => setVagaSelecionada(null)}>
              &times;
            </button>
            
            <h2>{vagaSelecionada.titulo}</h2>

            <span className="tag-tipo">{vagaSelecionada.tipo}</span>
            
            <p className="info-empresa">
              <strong>Empresa:</strong> {vagaSelecionada.empresa} &bull; <strong>Local:</strong> {vagaSelecionada.bairro}
            </p>
            
            <p className="descricao-vaga">
              {vagaSelecionada.descricao}
            </p>
          </div>
        </>
      )}
    </>
    )

}