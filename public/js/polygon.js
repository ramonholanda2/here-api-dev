// js/polygon.js
import { drawRoute, clearRoute } from './routing.js';
import { getSelectedClients } from './customers.js';

export function enablePolygonSelection(state, mode) {
  state.selectionShape = mode;
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
  showPolygonInstructions(state.selectionShape);
}

export function disablePolygonSelection(state) {
  state.polygonSelectionMode = false;
  state.polygonPoints = [];
  document.getElementById('mapContainer').style.cursor = 'default';

  const btn = document.getElementById('btnSelectArea');
  btn.innerHTML = '🔺 Triângulo';
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


  if (state.selectionShape === 'circle') {
    createInitialCircle(state, coord);
  } else if (state.selectionShape === 'square') {
    createInitialSquare(state, coord);
  } else {
    createInitialTriangle(state, coord);
  }
  disablePolygonSelection(state);
  setTimeout(showPolygonActions, 300);
}


export function createInitialSquare(state, center) {
  const zoom = state.map.getZoom();
  const size = Math.max(0.01, 1 / Math.pow(2, zoom - 5));

  const d = size;
  const p1 = { lat: center.lat + d, lng: center.lng - d };
  const p2 = { lat: center.lat + d, lng: center.lng + d };
  const p3 = { lat: center.lat - d, lng: center.lng + d };
  const p4 = { lat: center.lat - d, lng: center.lng - d };

  state.polygonPoints = [p1, p2, p3, p4];
  createResizablePolygon(state);
}

export function createInitialCircle(state, center) {
  const zoom = state.map.getZoom();
  const radius = Math.max(0.01, 1 / Math.pow(2, zoom - 5));

  state.circleCenter = { lat: center.lat, lng: center.lng };
  state.circleRadius = radius;

  // cria geometria inicial
  const points = buildCirclePoints(state.circleCenter, state.circleRadius);
  state.polygonPoints = points;

  createCirclePolygon(state);
}

function buildCirclePoints(center, radius, segments = 40) {
  const pts = [];
  for (let i = 0; i < segments; i++) {
    const ang = (i / segments) * 2 * Math.PI;
    pts.push({
      lat: center.lat + radius * Math.sin(ang),
      lng: center.lng + radius * Math.cos(ang)
    });
  }
  pts.push(pts[0]);
  return pts;
}

function createCirclePolygon(state) {
  const ls = new H.geo.LineString();
  state.polygonPoints.forEach(p => ls.pushPoint(p));

  state.currentPolygon = new H.map.Polygon(new H.geo.Polygon(ls), {
    style: {
      fillColor: 'rgba(0,100,200,0.3)',
      strokeColor: 'rgba(0,100,200,0.8)',
      lineWidth: 5
    }
  });

  state.polygonGroup = new H.map.Group({
    volatility: true,
    objects: [state.currentPolygon]
  });

  state.map.addObject(state.polygonGroup);

  setupCircleResize(state);

  state.map.getViewModel()
    .setLookAtData({ bounds: state.currentPolygon.getBoundingBox() });
}

function setupCircleResize(state) {
  cleanupCircleResize(state);

  state._circleResizing = false;

  state._circleDown = (evt) => {
    state._circleResizing = true;
    evt.stopPropagation();
  };

  state._circleMove = (evt) => {
    if (!state._circleResizing) return;

    const gp = state.map.screenToGeo(evt.currentPointer.viewportX, evt.currentPointer.viewportY);
    const dx = gp.lng - state.circleCenter.lng;
    const dy = gp.lat - state.circleCenter.lat;
    const newRadius = Math.max(0.001, Math.sqrt(dx * dx + dy * dy));

    state.circleRadius = newRadius;

    const pts = buildCirclePoints(state.circleCenter, newRadius);
    state.polygonPoints = pts;

    const ls = new H.geo.LineString();
    pts.forEach(p => ls.pushPoint(p));
    state.currentPolygon.setGeometry(new H.geo.Polygon(ls));
  };

  state._circleUp = () => {
    state._circleResizing = false;
  };

  state.currentPolygon.addEventListener('pointerdown', state._circleDown, true);
  state.map.addEventListener('pointermove', state._circleMove, true);
  state.map.addEventListener('pointerup', state._circleUp, true);
}

function cleanupCircleResize(state) {
  if (state._circleDown) {
    try { state.currentPolygon?.removeEventListener('pointerdown', state._circleDown, true); } catch { }
    try { state.map?.removeEventListener('pointermove', state._circleMove, true); } catch { }
    try { state.map?.removeEventListener('pointerup', state._circleUp, true); } catch { }
  }
}

export function createInitialTriangle(state, centerPoint) {
  const zoomLevel = state.map.getZoom();
  const triangleSize = Math.max(0.01, 1 / Math.pow(2, zoomLevel - 5));

  const point1 = { lat: centerPoint.lat + triangleSize, lng: centerPoint.lng };
  const point2 = { lat: centerPoint.lat - triangleSize / 2, lng: centerPoint.lng - triangleSize * Math.cos(Math.PI / 6) };
  const point3 = { lat: centerPoint.lat - triangleSize / 2, lng: centerPoint.lng + triangleSize * Math.cos(Math.PI / 6) };

  state.polygonPoints = [point1, point2, point3];
  createResizablePolygon(state);
}

export function createResizablePolygon(state) {
  const lineString = new H.geo.LineString();
  state.polygonPoints.forEach(point => lineString.pushPoint(point));
  //lineString.pushPoint(state.polygonPoints[0]);

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


  if (state.selectionShape === 'circle') {
    return verticeGroup;
  }


  const exterior = state.currentPolygon.getGeometry().getExterior();
  exterior.eachLatLngAlt((lat, lng, alt, index) => {
    const vertice = new H.map.Marker({ lat, lng }, {
      icon: new H.map.Icon(svgCircle, { anchor: { x: 8, y: 8 } })
    });
    vertice.draggable = true;
    vertice.setData({ verticeIndex: index++ }); // índice correto do LineString
    vertice.setZIndex(10000);                 // fica acima do fill
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

    if (!isFinite(geoPoint.lat) || !isFinite(geoPoint.lng)) return;

    evt.target.setGeometry(geoPoint);

    const verticeIndex = evt.target.getData().verticeIndex;
    console.log(verticeIndex)
    console.log(state)


    const exterior = state.currentPolygon.getGeometry().getExterior();
    exterior.removePoint(verticeIndex);
    exterior.insertPoint(verticeIndex, geoPoint);
    state.currentPolygon.setGeometry(new H.geo.Polygon(exterior));

    evt.stopPropagation();

  }, true);
}

export function showPolygonInstructions(shape) {
  const shapeFormat = {
    circle: 'circulo',
    rectangle: 'retangulo',
    triangle: 'triângulo'
  }
  const instructionDiv = document.createElement('div');
  instructionDiv.id = 'polygonInstructions';
  instructionDiv.className = 'polygon-instructions';
  instructionDiv.innerHTML = `
    <div class="instruction-content">
      <h4>🔲 Seleção de Área</h4>
      <p>Clique no mapa para criar um ${shapeFormat[shape]}.</p>
      <p>${shape == 'circle' ?  "Depois clique com o botão direito para redimensionar." : "Depois arraste os vértices para redimensionar."}</p>
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
      <h4>Área Selecionada</h4>
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
  state.polygonPoints = [];
  hidePolygonInstructions();
  hidePolygonActions();
  /*  clearRoute(state); */
  disablePolygonSelection(state);
}

export function selectClientsInPolygon(state) {
  if (!state.currentPolygon) {
    alert('Nenhuma área selecionada.');
    return;
  }

  let selectedCount = 0;
  const polygon = state.currentPolygon.getGeometry().getExterior();

  /* document.querySelectorAll('.client-checkbox').forEach(cb => {
    cb.checked = false;
    cb.closest('.client-item').classList.remove('selected');
  }); */

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
    alert(`${selectedCount} cliente(s) selecionado(s) na área.`);
    const selected = getSelectedClients(state);
    //if (selected.length >= 2) drawRoute(state, selected);
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