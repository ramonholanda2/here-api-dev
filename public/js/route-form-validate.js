// public/js/route-form-validation.js

export function validateRouteForm() {
  const routeName = document.getElementById('routeName');
  const routeDate = document.getElementById('routeDate');
  const routeTypeVisit = document.getElementById('routeTypeVisit');

  const markInvalid = (el, isInvalid) => {
    if (!el) return;
    if (isInvalid) {
      el.classList.add('field-error');
      el.setAttribute('aria-invalid', 'true');
    } else {
      el.classList.remove('field-error');
      el.removeAttribute('aria-invalid');
    }
  };

  const errors = [];

  const nameEmpty = !routeName?.value.trim();
  markInvalid(routeName, nameEmpty);
  if (nameEmpty) errors.push('Preencha o campo "Nome".');

  const dateEmpty = !routeDate?.value;
  markInvalid(routeDate, dateEmpty);
  if (dateEmpty) errors.push('Selecione a "Data de início".');

  const typeEmpty = !routeTypeVisit?.value;
  markInvalid(routeTypeVisit, typeEmpty);
  if (typeEmpty) errors.push('Selecione o "Tipo da visita".');

  if (errors.length > 0) {
    if (nameEmpty) routeName?.focus();
    else if (dateEmpty) routeDate?.focus();
    else if (typeEmpty) routeTypeVisit?.focus();
  }

  return {
    valid: errors.length === 0,
    errors
  };
}