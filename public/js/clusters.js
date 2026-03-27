import { statusColors } from "./config.js";


export function createClusterLayer(customers, state) {

    // --------------------------
    // Prepare Data Points
    // --------------------------
    const dataPoints = customers
        .map(c => {
            const lat = Number(String(c.LatitudeMeasure).replace(",", "."));
            const lng = Number(String(c.LongitudeMeasure).replace(",", "."));
            if (isNaN(lat) || isNaN(lng)) return null;

            return new H.clustering.DataPoint(lat, lng, null, {
                id: c.CustomerInternalID,
                title: c.CustomerName,
                color: statusColors[c.Z_Classificao_KUT] || "green"
            });
        })
        .filter(Boolean);

    // --------------------------
    // CONFIGURAR TEMA (igual documentação)
    // --------------------------

    // Noise icon (pontos individuais)
    const noiseIconTemplate =
        `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20">
            <circle cx="10" cy="10" r="8" fill="{color}" />
        </svg>`;

    // Cluster icon SVG
    const clusterSvgTemplate =
        `<svg xmlns="http://www.w3.org/2000/svg" width="{diameter}" height="{diameter}">
            <circle cx="{radius}" cy="{radius}" r="{radius}" fill="#0066cc" />
            <text x="{radius}" y="{txtY}" text-anchor="middle" font-family="Arial"
                  font-size="{font}" fill="white">{weight}</text>
        </svg>`;


    const theme = {

        // ------------- CLUSTERS ---------------

        getClusterPresentation: function (cluster) {

            const weight = cluster.getWeight();
            const radius = 10 + Math.min(weight * 0.4, 20);
            const diameter = radius * 2;

            if (radius > 30) radius = 30;  // limite máximo

            const svg = clusterSvgTemplate
                .replace(/\{radius\}/g, radius)
                .replace(/\{diameter\}/g, diameter)
                .replace(/\{weight\}/g, weight)
                .replace(/\{font\}/g, 12)
                .replace(/\{txtY\}/g, radius + 4);

            const icon = new H.map.Icon(svg, {
                size: { w: diameter, h: diameter },
                anchor: { x: radius, y: radius }
            });

            const marker = new H.map.Marker(cluster.getPosition(), {
                icon,
                min: cluster.getMinZoom(),
                max: cluster.getMaxZoom()
            });

            marker.setZIndex(9999);
            marker.setData(cluster);

            return marker;
        },

        getNoisePresentation: function (noisePoint) {

            const data = noisePoint.getData();

            const icon = new H.map.Icon(`/public/images/dot-${data.color}.svg`, {
                size: { w: 28, h: 32 }
            });

            const marker = new H.map.Marker(noisePoint.getPosition(), {
                icon,
                min: noisePoint.getMinZoom()
            });
            marker.setZIndex(9999);
            marker.setData(noisePoint);

            return marker;
        }

    };

    const provider = new H.clustering.Provider(dataPoints, {
        clusteringOptions: {
            eps: 90,
            minWeight: 10,
        },
        theme
    });

    provider.addEventListener("tap", evt => {

        const marker = evt.target;
        const point = marker.getData();

        if (point?.isCluster()) {

            const bounds = buildClusterBounds(point);
            state.map.getViewModel().setLookAtData({ bounds });

        } else {
            const pointData = point.getData();

            const url = `${state.salesCloudURL}/sap/public/byd/runtime?bo_ns=http://sap.com/thingTypes&bo=COD_GENERIC&node=Root&operation=OnExtInspect&param.InternalID=${pointData.id}&param.Type=COD_ACCOUNT_TT&sapbyd-agent=TAB`;

            const bubble = new H.ui.InfoBubble(marker.getGeometry(), {
                content: `
        <div style="font-family: '72', Arial; padding: 0.5rem;">
            <a href="${decodeURIComponent(url)}" 
               target="_blank" 
               style="text-decoration:none; color:#0066cc; font-size:14px;">
                <strong>${pointData.id} - ${pointData.title}</strong><br>
                <span style="font-size:12px;">Abrir no C4C →</span>
            </a>
        </div>
    `
            });

            state.ui.addBubble(bubble);
        }
    });

    return new H.map.layer.ObjectLayer(provider);
}


function buildClusterBounds(cluster) {
    let minLat = 90, maxLat = -90;
    let minLng = 180, maxLng = -180;

    cluster.forEachDataPoint(dp => {
        const pos = dp.getPosition();
        minLat = Math.min(minLat, pos.lat);
        maxLat = Math.max(maxLat, pos.lat);
        minLng = Math.min(minLng, pos.lng);
        maxLng = Math.max(maxLng, pos.lng);
    });

    return new H.geo.Rect(maxLat, minLng, minLat, maxLng);
}