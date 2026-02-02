// js/polygon.js
import { drawRoute, clearRoute } from './routing.js';
import { getSelectedClients } from './customers.js';

export function enablePolygonSelection(state) {
  if (state.polygonSelectionMode) {
    disablePolygonSelection(state);
    return;
  }
  state.polygonSelectionMode = true;
  document.getElementById('mapContainer').style.cursor = 'crosshair';

  const btn = document.getElementById('btnSelectArea');
  btn.innerHTML = '🔲 Cancelar Seleção';
  btn.classList.add('active');

  state.map.addEventListener('tap', state._onMapClick || (state._onMapClick = evt => onMapClick(state, evt)));
  showPolygonInstructions();
}

export function disablePolygonSelection(state) {
  state.polygonSelectionMode = false;
  state.trianglePoints = [];
  document.getElementById('mapContainer').style.cursor = 'default';

  const btn = document.getElementById('btnSelectArea');
  btn.innerHTML = '🔲 Selecionar Área';
  btn.classList.remove('active');

  if (state._onMapClick) {
    state.map.removeEventListener('tap', state._onMapClick);
  }
  hidePolygonInstructions();
}

export function onMapClick(state, evt) {
  if (!state.polygonSelectionMode || state.currentPolygon) return;
  evt.stopPropagation();

  const coord = state.map.screenToGeo(
    evt.currentPointer.viewportX,
    evt.currentPointer.viewportY
  );

  createInitialTriangle(state, coord);
  disablePolygonSelection(state);
  setTimeout(showPolygonActions, 300);
}

export function createInitialTriangle(state, centerPoint) {
  const zoomLevel = state.map.getZoom();
  const triangleSize = Math.max(0.01, 1 / Math.pow(2, zoomLevel - 5));

  const point1 = { lat: centerPoint.lat + triangleSize, lng: centerPoint.lng };
  const point2 = { lat: centerPoint.lat - triangleSize / 2, lng: centerPoint.lng - triangleSize * Math.cos(Math.PI / 6) };
  const point3 = { lat: centerPoint.lat - triangleSize / 2, lng: centerPoint.lng + triangleSize * Math.cos(Math.PI / 6) };

  state.trianglePoints = [point1, point2, point3];
  createResizableTriangle(state);
}

export function createResizableTriangle(state) {
  const lineString = new H.geo.LineString();
  state.trianglePoints.forEach(point => lineString.pushPoint(point));
  lineString.pushPoint(state.trianglePoints[0]);

  state.currentPolygon = new H.map.Polygon(new H.geo.Polygon(lineString), {
    style: {
      fillColor: 'rgba(0, 100, 200, 0.3)',
      strokeColor: 'rgba(0, 100, 200, 0.8)',
      lineWidth: 5
    }
  });

  const verticeGroup = createVerticeGroup(state);

  state.polygonGroup = new H.map.Group({
    volatility: true,
    objects: [state.currentPolygon, verticeGroup]
  });

  state.currentPolygon.draggable = true;
  state.map.addObject(state.polygonGroup);

  setupPolygonEvents(state, state.polygonGroup, verticeGroup);
  verticeGroup.setVisibility(true);
  state.map.getViewModel().setLookAtData({ bounds: state.currentPolygon.getBoundingBox() });
}

export function createVerticeGroup(state) {
  const svgCircle = `<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="6" fill="red" stroke="white" stroke-width="2"/>
  </svg>`;

  const verticeGroup = new H.map.Group({ visibility: false });

  state.trianglePoints.forEach((point, index) => {
    const vertice = new H.map.Marker(point, {
      icon: new H.map.Icon(svgCircle, { anchor: { x: 8, y: 8 } })
    });
    vertice.draggable = true;
    vertice.setData({ verticeIndex: index });
    verticeGroup.addObject(vertice);
  });

  return verticeGroup;
}

export function setupPolygonEvents(state, mainGroup, verticeGroup) {
  let polygonTimeout;

  mainGroup.addEventListener('pointerenter', function () {
    if (polygonTimeout) { clearTimeout(polygonTimeout); polygonTimeout = null; }
    verticeGroup.setVisibility(true);
    document.body.style.cursor = 'move';
  }, true);

  mainGroup.addEventListener('pointerleave', function (evt) {
    const timeout = evt.currentPointer.type == 'touch' ? 1000 : 200;
    polygonTimeout = setTimeout(() => {
      verticeGroup.setVisibility(false);
      document.body.style.cursor = 'default';
    }, timeout);
  }, true);

  verticeGroup.addEventListener('pointerenter', function () {
    document.body.style.cursor = 'pointer';
    if (polygonTimeout) { clearTimeout(polygonTimeout); polygonTimeout = null; }
  }, true);

  verticeGroup.addEventListener('pointerleave', function () {
    document.body.style.cursor = 'default';
  }, true);

  verticeGroup.addEventListener('drag', function (evt) {
    const pointer = evt.currentPointer;
    const geoLineString = state.currentPolygon.getGeometry().getExterior();
    const geoPoint = state.map.screenToGeo(pointer.viewportX, pointer.viewportY);

    evt.target.setGeometry(geoPoint);

    const verticeIndex = evt.target.getData().verticeIndex;
    state.trianglePoints[verticeIndex] = geoPoint;

    geoLineString.removePoint(verticeIndex);
    geoLineString.insertPoint(verticeIndex, geoPoint);

    if (verticeIndex === 0) {
      geoLineString.removePoint(state.trianglePoints.length);
      geoLineString.insertPoint(state.trianglePoints.length, geoPoint);
    }

    state.currentPolygon.setGeometry(new H.geo.Polygon(geoLineString));
    evt.stopPropagation();
  }, true);
}

export function showPolygonInstructions() {
  const instructionDiv = document.createElement('div');
  instructionDiv.id = 'polygonInstructions';
  instructionDiv.className = 'polygon-instructions';
  instructionDiv.innerHTML = `
    <div class="instruction-content">
      <h4>🔲 Seleção de Área</h4>
      <p>Clique no mapa para criar um triângulo.</p>
      <p>Depois arraste os vértices para redimensionar.</p>
      <div class="instruction-buttons">
        <button class="fiori-button" id="btnCancelPolygon">🗑️ Cancelar</button>
      </div>
    </div>
  `;
  document.body.appendChild(instructionDiv);

  document.getElementById('btnCancelPolygon')?.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('polygon:clear'));
  });
}

export function hidePolygonInstructions() {
  document.getElementById('polygonInstructions')?.remove();
}

export function showPolygonActions() {
  const actionDiv = document.createElement('div');
  actionDiv.id = 'polygonActions';
  actionDiv.className = 'polygon-actions';
  actionDiv.innerHTML = `
    <div class="action-content">
      <h4>🔺 Área Triangular Selecionada</h4>
      <div class="action-buttons">
        <button class="fiori-button primary" id="btnSelectClientsInArea">👥 Selecionar Clientes na Área</button>
        <button class="fiori-button" id="btnRemoveArea">🗑️ Remover Área</button>
      </div>
    </div>
  `;
  document.body.appendChild(actionDiv);

  document.getElementById('btnSelectClientsInArea')?.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('polygon:selectClients'));
  });
  document.getElementById('btnRemoveArea')?.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('polygon:clear'));
  });
}

export function hidePolygonActions() {
  document.getElementById('polygonActions')?.remove();
}

export function clearPolygonSelection(state) {
  if (state.polygonGroup) {
    state.map.removeObject(state.polygonGroup);
    state.polygonGroup = null;
    state.currentPolygon = null;
  }
  state.trianglePoints = [];
  hidePolygonInstructions();
  hidePolygonActions();
  clearRoute(state);
  disablePolygonSelection(state);
}

export function selectClientsInPolygon(state) {
  if (!state.currentPolygon) {
    alert('Nenhuma área selecionada.');
    return;
  }

  let selectedCount = 0;
  const polygon = state.currentPolygon.getGeometry().getExterior();

  document.querySelectorAll('.client-checkbox').forEach(cb => {
    cb.checked = false;
    cb.closest('.client-item').classList.remove('selected');
  });

  state.allCustomers.forEach(customer => {
    const point = { lat: customer.LatitudeMeasure, lng: customer.LongitudeMeasure };
    if (isPointInPolygon(point, polygon)) {
      const checkbox = document.querySelector(`.client-checkbox[data-id="${customer.CustomerInternalID}"]`);
      if (checkbox) {
        checkbox.checked = true;
        checkbox.closest('.client-item').classList.add('selected');
        selectedCount++;
      }
    }
  });

  if (selectedCount > 0) {
    alert(`${selectedCount} cliente(s) selecionado(s) na área triangular.`);
    const selected = getSelectedClients(state);
    if (selected.length >= 2) drawRoute(state, selected);
  } else {
    alert('Nenhum cliente encontrado na área selecionada.');
  }
}

export function isPointInPolygon(point, polygon) {
  const vertices = [];
  polygon.eachLatLngAlt((lat, lng) => vertices.push({ lat, lng }));

  // Remove ponto repetido final == primeiro
  if (vertices.length > 0 &&
      vertices[0].lat === vertices[vertices.length - 1].lat &&
      vertices[0].lng === vertices[vertices.length - 1].lng) {
    vertices.pop();
  }

  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    if (((vertices[i].lat > point.lat) !== (vertices[j].lat > point.lat)) &&
        (point.lng < (vertices[j].lng - vertices[i].lng) * (point.lat - vertices[i].lat) /
        (vertices[j].lat - vertices[i].lat) + vertices[i].lng)) {
      inside = !inside;
    }
  }
  return inside;
}