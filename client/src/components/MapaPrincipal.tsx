import { useRef } from 'react';
import 'leaflet/dist/leaflet.css'
import '../App.css'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import { Vaga } from '../App';
import Filtros from './Filtros';


interface MapaPrincipalProps{
    abaAtiva: string
    salvadorCentro: [number, number]
    buscarVagas: (lat: number, lon: number, raio: number) => void
    vagasFiltradas: Vaga[]
    setVagaSelecionada: (vaga: Vaga | null) => void
    mostrarFiltros: boolean
    filtrosAtivos: string[]
    alternarFiltro: (tipo: string) => void
    bairrosDisponiveis: string[]
    mostrarBairro: string
    setMostrarBairro: (smb: string) => void
    setMostrarFiltros: (smf: boolean) => void
    termoBusca: string
    setTermoBusca: (stb: string) => void
}



function BuscadorDinamico({buscarVagas, abaAtiva, salvadorCentro, vagasFiltradas, setVagaSelecionada, mostrarFiltros, filtrosAtivos, alternarFiltro, bairrosDisponiveis, mostrarBairro, setMostrarBairro, setMostrarFiltros} : MapaPrincipalProps) {

    const tipo = localStorage.getItem('perfilUsuario');


    const timerRef = useRef<number | null>(null);


    useMapEvents({
      moveend: (evento) => {
        const mapa = evento.target;
        const centro = mapa.getCenter();
        const zoom = mapa.getZoom();

        let raioDinamico = 5000

        if(zoom >= 16){
            raioDinamico = 2000;
        } else if (zoom >= 14) {
          raioDinamico = 5000;
        } else if (zoom >= 12) {
          raioDinamico = 15000;
        } else {
          raioDinamico = 30000;
        }

        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }

        timerRef.current = window.setTimeout(() => {
          console.log("Mapa estabilizou. Buscando vagas para:", centro.lat, centro.lng);
          buscarVagas(centro.lat, centro.lng, raioDinamico);
        }, 500);
      },
    });
    return null;
  }


export default function MapaPrincipal({abaAtiva, salvadorCentro, buscarVagas, vagasFiltradas, setVagaSelecionada, mostrarFiltros, filtrosAtivos, alternarFiltro, bairrosDisponiveis, mostrarBairro, setMostrarBairro, setMostrarFiltros, termoBusca, setTermoBusca}:MapaPrincipalProps){
    return(
        <>
            {abaAtiva === 'mapa' &&(
                <>
                    <MapContainer center={salvadorCentro} zoom={13} scrollWheelZoom = {true} zoomControl={false}>
                        <TileLayer 
                            attribution='<a href="https://carto.com/attributions">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        />
                        <BuscadorDinamico 
                            buscarVagas={buscarVagas}
                            abaAtiva={abaAtiva}
                            salvadorCentro={salvadorCentro}
                            vagasFiltradas={vagasFiltradas}
                            setVagaSelecionada = {setVagaSelecionada}
                            mostrarFiltros = {mostrarFiltros}
                            filtrosAtivos = {filtrosAtivos}
                            alternarFiltro = {alternarFiltro}
                            bairrosDisponiveis = {bairrosDisponiveis}
                            mostrarBairro = {mostrarBairro}
                            setMostrarBairro = {setMostrarBairro}
                            setMostrarFiltros = {setMostrarFiltros}
                            termoBusca = {termoBusca}
                            setTermoBusca = {setTermoBusca}
                        />
                        {vagasFiltradas.map((vaga)=>(
                            <Marker 
                                key={vaga.id}
                                position={[vaga.latitude, vaga.longitude]}
                                eventHandlers={{click: () => setVagaSelecionada(vaga)}}
                            />
                        ))}
                    </MapContainer>

                    <Filtros
                        mostrarFiltros = {mostrarFiltros}
                        filtrosAtivos = {filtrosAtivos}
                        alternarFiltro = {alternarFiltro}
                        bairrosDisponiveis = {bairrosDisponiveis}
                        mostrarBairro = {mostrarBairro}
                        setMostrarBairro = {setMostrarBairro}
                        setMostrarFiltros = {setMostrarFiltros}
                        termoBusca = {termoBusca}
                        setTermoBusca = {setTermoBusca}
                    />

                </>
            )}
        </>
    )
}
