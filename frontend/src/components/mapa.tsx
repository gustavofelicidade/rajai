import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { FeatureCollection, Feature, Geometry } from 'geojson';
import type { Layer } from 'leaflet';

// Interface para as propriedades específicas dos seus dados (bairros do Rio)
interface BairroProperties {
  NOME: string;
  [key: string]: any; // Permite outras propriedades desconhecidas
}

const mapStyle = {
  height: '100vh',
  width: '100%'
};

export function Mapa() {
  // Tipamos o estado para aceitar uma FeatureCollection ou null
  const [geoJsonData, setGeoJsonData] = useState<FeatureCollection | null>(null);

  const centroRio: [number, number] = [-22.9068, -43.1729];

  useEffect(() => {
    const urlGeoJson = 'https://gist.githubusercontent.com/esperanc/db213370dd176f8524ae6ba32433f90a/raw/Limite_Bairro.geojson';

    fetch(urlGeoJson)
      .then(response => response.json())
      .then((data: FeatureCollection) => {
        setGeoJsonData(data);
      })
      .catch(err => console.error("Erro ao carregar dados:", err));
  }, []);

  // Tipagem da função onEachFeature
  const onEachFeature = (feature: Feature<Geometry, BairroProperties>, layer: Layer) => {
    // Popup
    if (feature.properties && feature.properties.NOME) {
      layer.bindPopup(feature.properties.NOME);
    }

    // Eventos de Hover
    // Nota: 'setStyle' existe em camadas vetoriais (Path), mas o tipo genérico 'Layer' 
    // do Leaflet às vezes reclama. Aqui fazemos um cast simples ou tratamos como 'any' 
    // dentro do evento para evitar complexidade excessiva.
    layer.on({
      mouseover: (e) => {
        const layer = e.target;
        layer.setStyle({
          weight: 3,
          color: '#666',
          dashArray: '',
          fillOpacity: 0.7
        });
      },
      mouseout: (e) => {
        const layer = e.target;
        // Reseta para o estilo original definido no componente GeoJSON
        layer.setStyle({
          weight: 1,
          color: 'blue',
          fillOpacity: 0.3
        });
      }
    });
  };

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MapContainer
        center={centroRio}
        zoom={11}
        style={mapStyle}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {geoJsonData && (
          <GeoJSON
            data={geoJsonData}
            style={() => ({
              color: 'blue',
              weight: 1,
              fillColor: 'blue',
              fillOpacity: 0.3
            })}
            // O React Leaflet espera uma assinatura genérica, mas nossa função está tipada
            onEachFeature={onEachFeature as any}
          />
        )}
      </MapContainer>
    </div>
  );
}