// js/routing.js
import { getSelectedClients } from './customers.js';

export function drawRoute(state, waypoints) {
  if (state.routeLine) {
    state.map.removeObject(state.routeLine);
    state.routeLine = null;
  }

  const getLat = p => p.latitude ?? p.LatitudeMeasure;
  const getLng = p => p.longitude ?? p.LongitudeMeasure;

  const routingParams = {
    transportMode: 'car',
    origin: `${getLat(waypoints[0])},${getLng(waypoints[0])}`,
    destination: `${getLat(waypoints.at(-1))},${getLng(waypoints.at(-1))}`,
    return: 'polyline,summary,actions,instructions',
  };

  if (waypoints.length > 2) {
    routingParams.via = waypoints.slice(1, -1).map(p => `${getLat(p)},${getLng(p)}`);
  }

  state.router.calculateRoute(routingParams, result => {
    if (result.routes.length) {
      const route = result.routes[0];
      state.currentRoute = route;
      const linestring = H.geo.LineString.fromFlexiblePolyline(route.sections[0].polyline);

      state.routeLine = new H.map.Polyline(linestring, {
        style: { strokeColor: '#0a6ed1', lineWidth: 4 }
      });

      state.map.addObject(state.routeLine);
      state.map.getViewModel().setLookAtData({ bounds: state.routeLine.getBoundingBox() });

      updateRouteInfo(route, waypoints.length);
    }
  }, error => {
    console.error("Erro ao calcular rota:", error);
  });
}

export function updateRouteInfo(route, clientCount) {
  const distance = Math.round(route.sections[0].summary.length / 1000);
  const duration = Math.round(route.sections[0].summary.duration / 60);

  document.getElementById('routeDistance').textContent = `${distance}`;
  document.getElementById('routeDuration').textContent = `${duration}`;
  document.getElementById('routeClients').textContent = `${clientCount}`;
  document.getElementById('routeInfo').classList.add('visible');
}

export function clearRoute(state) {
  console.log(state)
  if (state.routeLine) {
    state.map.removeObject(state.routeLine);
    state.routeLine = null;
    state.currentRoute = null;
  }
  //document.querySelectorAll('.client-checkbox').forEach(cb => cb.checked = false);
  document.querySelectorAll('.client-item').forEach(item => item.classList.remove('selected'));
  document.getElementById('routeInfo').classList.remove('visible');
}

export function optimizeRoute(state) {
  const selected = getSelectedClients(state);
  if (selected.length >= 2) {
    drawRoute(state, selected);
  } else {
    alert('Selecione pelo menos 2 clientes para calcular a rota.');
  }
}