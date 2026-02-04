// public/js/markers.js
export function addMarker(state, coords, color, title, customerID) {

  const marker = new H.map.Marker(coords, {
    icon: new H.map.Icon(`/public/images/dot-${color}.svg`), size: { w: 32, h: 32 } 
  });
  marker.setData(title);
  marker.addEventListener("tap", evt => {
    const bubble = new H.ui.InfoBubble(evt.target.getGeometry(), {
      content: `<div style="font-family: '72', Arial; padding: 0.5rem;">
        <strong>${evt.target.getData()}</strong>
      </div>`
    });
    state.ui.addBubble(bubble);
  });
  state.map.addObject(marker);
  state.markers.push({ customerID, marker: marker });
}

export function clearMarkers(state) {
  if (state.markers && state.markers.length) {
    state.markers.forEach(m => state.map.removeObject(m));
  }
  state.markers = [];
}


export function updateMarkerVisibility(state, filteredCustomers) {
  const visibleIds = new Set(filteredCustomers.map(customer => customer.CustomerInternalID));
  
  state.markers.forEach((markerObj) => {
    const shouldShow = visibleIds.has(markerObj.customerID);
    markerObj.marker.setVisibility(shouldShow);
  });
}
