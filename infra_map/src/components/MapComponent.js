import React, { useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/Map.css';
import SidebarComponent from './SidebarComponent';

const lineStyles = {
    'Transmission Lines Capacity < 132 kV': { color: 'yellow', weight: 2 },
    'Transmission Lines Capacity 132-220 kV': { color: 'orange', weight: 3 },
    'Transmission Lines Capacity 220-500 kV': { color: 'red', weight: 4 },
    'Transmission Lines Capacity >= 500 kV': { color: 'purple', weight: 5 },
    'Gas Pipelines Gas Pipeline': { color: 'grey', weight: 3 },
    'Gas Pipelines Proposed Gas Pipeline': { color: 'grey', dashArray: '5, 5', weight: 3 },
    'Oil Pipelines Oil pipeline': { color: 'black', weight: 3 },
    'Oil Pipelines Proposed Oil pipeline': { color: 'black', dashArray: '5, 5', weight: 3 },
    'Railway Lines Operational': { color: 'blue', weight: 2 },
    'Railway Lines Abandoned': { color: 'blue', dashArray: '3, 3', weight: 1 },
    'Railway Lines Dismantled': { color: 'blue', dashArray: '1, 5', weight: 1 }
};

const icons = {
    'Airports Small Airport': '/assets/images/airport1.png',
    'Airports Medium Airport': '/assets/images/airport2.png',
    'Airports Large Airport': '/assets/images/airport3.png',
    'Airports Heliport': '/assets/images/heliport.png',
    'Liquid Fuel Terminals Operational': '/assets/images/fuel_terminal1.png',
    'Liquid Fuel Terminals Decommissioned': '/assets/images/fuel_terminal2.png',
    'Railway Stations Operational': '/assets/images/railway_station1.png',
    'Railway Stations Abandoned': '/assets/images/railway_station2.png',
    'Railway Stations Disused': '/assets/images/railway_station3.png',
    'Major Power Stations Water': '/assets/images/power_station_blue.png',
    'Major Power Stations Wind': '/assets/images/power_station_aqua.png',
    'Major Power Stations Natural Gas': '/assets/images/power_station_lgrey.png',
    'Major Power Stations Coal': '/assets/images/power_station_black.png',
    'Major Power Stations Solar': '/assets/images/power_station_yellow.png',
    'Major Power Stations Biogas': '/assets/images/power_station_green.png',
    'Major Power Stations Distillate': '/assets/images/power_station_purple.png',
    'Major Power Stations Biomass': '/assets/images/power_station_brown.png',
    'Major Power Stations Coal Seam Methane': '/assets/images/power_station_dgrey.png',
    'Major Power Stations Other': '/assets/images/power_station_pink.png',
    'Transmission Substation Substations': '/assets/images/substation1.png',
    'Transmission Substation Zone': '/assets/images/substation2.png',
    'Transmission Substation Terminal': '/assets/images/substation3.png',
    'Transmission Substation Switchyard': '/assets/images/substation4.png',
    'Transmission Substation Transmission': '/assets/images/substation5.png',
    'Waste Management Facility C&D Waste Recycling Facility': '/assets/images/waste_management1.png',
    'Waste Management Facility Landfill � Putrescible': '/assets/images/waste_management2.png',
    'Waste Management Facility Transfer Station': '/assets/images/waste_management3.png',
    'Waste Management Facility Reuse Shop': '/assets/images/waste_management4.png',
    'Waste Management Facility Organics Recycling Facility': '/assets/images/waste_management5.png',
    'Waste Management Facility E-Waste Drop-Off Facility': '/assets/images/waste_management6.png',
    'Waste Management Facility Materials Recovery Facility': '/assets/images/waste_management7.png',
    'Waste Management Facility Other Waste Facility': '/assets/images/waste_management8.png',
    'Waste Management Facility Soft Plastics Drop-Off Facility': '/assets/images/waste_management9.png',
    'Waste Management Facility Other Recycling Facility': '/assets/images/waste_management10.png',
    'Waste Management Facility Landfill � Not Classified': '/assets/images/waste_management11.png',
    'Waste Management Facility Metals Recovery Facility (MRF)': '/assets/images/waste_management12.png',
    'Waste Management Facility Plastics Recovery Facility': '/assets/images/waste_management13.png',
    'Waste Management Facility Plastics Processing Facility': '/assets/images/waste_management14.png',
    'Waste Management Facility Paper and Cardboard Recycling Facility': '/assets/images/waste_management15.png',
    'Waste Management Facility Rubber Recycling Facility': '/assets/images/waste_management16.png',
    'Waste Management Facility Landfill � Inert': '/assets/images/waste_management17.png',
    'Waste Management Facility Container Deposit Scheme Drop-Off Facility': '/assets/images/waste_management18.png',
    'Waste Management Facility Other': '/assets/images/waste_management19.png',
    'Maritime Ports Commodity': '/assets/images/port1.png',
    'Maritime Ports Commodity & Military': '/assets/images/port2.png'
    // Add more icons as needed
};

const addGeoJSONLayer = (data, type, subType, property, value, searchText, map) => {
    const onEachFeature = (feature, layer) => {
        if (feature.properties) {
            let popupContent = '<ul>';
            for (const prop in feature.properties) {
                popupContent += `<li><strong>${prop}</strong>: ${feature.properties[prop]}</li>`;
            }
            popupContent += '</ul>';
            layer.bindPopup(popupContent);
        }
    };

    const filterFeature = (feature) => {
        let matchesProperty = false;
        if (property === 'capacity_kv') {
            const capacity = feature.properties[property];
            if (value === '<132') matchesProperty = capacity < 132;
            if (value === '>=132<220') matchesProperty = capacity >= 132 && capacity < 220;
            if (value === '>=220<500') matchesProperty = capacity >= 220 && capacity < 500;
            if (value === '>=500') matchesProperty = capacity >= 500;
        } else if (value === 'Other') {
            const specifiedValues = subTypes.map(sub => sub.value);
            matchesProperty = !specifiedValues.includes(feature.properties[property]);
        } else {
            matchesProperty = feature.properties[property] === value;
        }

        const matchesSearchText = searchText ? Object.values(feature.properties).some(propValue =>
            String(propValue).toLowerCase().includes(searchText.toLowerCase())
        ) : true;

        return matchesProperty && matchesSearchText;
    };

    const layer = L.geoJSON(data, {
        filter: filterFeature,
        style: (feature) => {
            const key = `${type} ${subType}`;
            return lineStyles[key] || {};
        },
        pointToLayer: (feature, latlng) => {
            const key = `${type} ${subType}`;
            const icon = icons[key];
            if (!icon) {
                console.error(`Icon not found for key: ${key}`);
                return L.marker(latlng);
            }
            return L.marker(latlng, { icon: L.icon({ iconUrl: icon, iconSize: [15, 15] }) });
        },
        onEachFeature: onEachFeature
    });
    layer.addTo(map);
    return layer;
};

const MapComponent = ({ geoJsonFiles }) => {
    const [map, setMap] = useState(null);
    const [layers, setLayers] = useState({});
    const [activeLayers, setActiveLayers] = useState([]);
    const [searchText, setSearchText] = useState('');

    useEffect(() => {
        if (map) return;
        const mapElement = document.getElementById('map');
        const mapInstance = L.map(mapElement).setView([-25.2744, 133.7751], 5);
        setMap(mapInstance);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
        }).addTo(mapInstance);

        const legend = L.control({ position: 'bottomright' });

        legend.onAdd = function () {
            const div = L.DomUtil.create('div', 'info legend');
            div.innerHTML = '<h4>Legend</h4>';
            activeLayers.forEach(layer => {
                const layerName = layer.split(' ').slice(1).join(' ');
                if (icons[layer]) {
                    div.innerHTML += `<i style="background-image: url(${icons[layer]}); width: 20px; height: 20px; display: inline-block;"></i> ${layerName}<br>`;
                } else if (lineStyles[layer]) {
                    const style = lineStyles[layer];
                    const dashArray = style.dashArray ? `stroke-dasharray: ${style.dashArray};` : '';
                    div.innerHTML += `<svg width="20" height="10" style="display: inline-block;"><line x1="0" y1="5" x2="20" y2="5" style="stroke:${style.color}; stroke-width:2; ${dashArray}"></line></svg> ${layerName}<br>`;
                }
            });
            return div;
        };

        legend.addTo(mapInstance);
        mapInstance.legend = legend;

        return () => {
            mapInstance.removeControl(legend);
        };
    }, [map]);

    useEffect(() => {
        if (map && map.legend) {
            map.legend.remove();
            const legend = L.control({ position: 'bottomright' });

            legend.onAdd = function () {
                const div = L.DomUtil.create('div', 'info legend');
                div.innerHTML = '<h4>Legend</h4>';
                activeLayers.forEach(layer => {
                    const layerName = layer.split(' ').slice(1).join(' ');
                    if (icons[layer]) {
                        div.innerHTML += `<i style="background-image: url(${icons[layer]}); width: 20px; height: 20px; display: inline-block;"></i> ${layerName}<br>`;
                    } else if (lineStyles[layer]) {
                        const style = lineStyles[layer];
                        const dashArray = style.dashArray ? `stroke-dasharray: ${style.dashArray};` : '';
                        div.innerHTML += `<svg width="20" height="10" style="display: inline-block;"><line x1="0" y1="5" x2="20" y2="5" style="stroke:${style.color}; stroke-width:2; ${dashArray}"></line></svg> ${layerName}<br>`;
                    }
                });
                return div;
            };

            legend.addTo(map);
            map.legend = legend;
        }
    }, [activeLayers]);

    const toggleLayer = async (type, subType, property, value, url, searchText) => {
        const uniqueId = subType ? `${type} ${subType}` : type;
        console.log(`Fetching URL: ${url}`); // Debugging line
        if (map) {
            if (layers[uniqueId]) {
                map.removeLayer(layers[uniqueId]);
                setLayers((prev) => {
                    const newLayers = { ...prev };
                    delete newLayers[uniqueId];
                    return newLayers;
                });
                setActiveLayers((prev) => prev.filter(layer => layer !== uniqueId));
            } else {
                try {
                    if (!url) {
                        throw new Error('URL is null or undefined');
                    }
                    const response = await fetch(url);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const data = await response.json();
                    console.log(`Adding layer with search text: ${searchText}`); // Debugging line
                    const newLayer = addGeoJSONLayer(data, type, subType, property, value, searchText, map);
                    setLayers((prev) => ({ ...prev, [uniqueId]: newLayer }));
                    setActiveLayers((prev) => [...prev, uniqueId]);
                } catch (error) {
                    console.error(`Error fetching GeoJSON: ${error}`);
                }
            }
        }
    };

    const updateSearchText = (text) => {
        setSearchText(text);
        console.log(`Updating search text: ${text}`); // Debugging line
        activeLayers.forEach(layer => {
            const [type, subType] = layer.split(' ');
            const file = geoJsonFiles.find(file => file.name === type);
            const subTypeObj = file?.subTypes.find(sub => sub.name === subType);
            const url = subTypeObj?.url;

            if (url) {
                console.log(`Re-fetching layer: ${type} ${subType} with URL: ${url}`); // Debugging line
                toggleLayer(type, subType, subTypeObj.property, subTypeObj.value, url, text);
            }
        });
    };

    return (
        <div className="map-container">
            <SidebarComponent toggleLayer={toggleLayer} updateSearchText={updateSearchText} geoJsonFiles={geoJsonFiles} />
            <div id="map" className="map"></div>
        </div>
    );
};

export default MapComponent;