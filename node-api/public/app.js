(function () {
  if (!InterseguroAuth.requireAuth()) return;

  const SAMPLE = '1, 2\n3, 4';

  const config = (function resolveConfig() {
    const meta = document.querySelector('meta[name="go-api-url"]');
    const fromMeta = meta?.getAttribute('content')?.trim();
    const fromRuntime = window.__INTERSEGURO_CONFIG__?.goApiUrl?.trim();
    const fromQuery = new URLSearchParams(window.location.search).get('api');
    const directGoUrl = (fromQuery || fromRuntime || fromMeta || '').replace(/\/$/, '');

    // Same-origin proxy: evita CORS y que el Bearer no llegue a Go en Render.
    const useProxy =
      !directGoUrl ||
      (() => {
        try {
          return new URL(directGoUrl).origin !== window.location.origin;
        } catch {
          return true;
        }
      })();

    const baseUrl = useProxy ? window.location.origin : directGoUrl;

    return {
      goApiBaseUrl: baseUrl,
      qrPath: '/api/v1/qr-factorization',
      displayGoUrl: directGoUrl || baseUrl,
      useProxy,
    };
  })();

  const els = {
    matrixInput: document.getElementById('matrix-input'),
    btnSubmit: document.getElementById('btn-submit'),
    btnSample: document.getElementById('btn-sample'),
    btnClear: document.getElementById('btn-clear'),
    clientError: document.getElementById('client-error'),
    status: document.getElementById('status'),
    results: document.getElementById('results'),
    matrixQ: document.getElementById('matrix-q'),
    matrixR: document.getElementById('matrix-r'),
    statistics: document.getElementById('statistics'),
    apiUrlLabel: document.getElementById('api-url-label'),
    userLabel: document.getElementById('user-label'),
    btnLogout: document.getElementById('btn-logout'),
  };

  els.apiUrlLabel.textContent = config.useProxy
    ? `${config.displayGoUrl || 'Go API'} (vía proxy Node)`
    : config.goApiBaseUrl;
  els.userLabel.textContent = InterseguroAuth.getUsername() || 'Usuario';
  els.btnLogout.addEventListener('click', () => InterseguroAuth.logout());

  els.btnSample.addEventListener('click', () => {
    els.matrixInput.value = SAMPLE;
    hideClientError();
  });

  els.btnClear.addEventListener('click', () => {
    els.matrixInput.value = '';
    hideClientError();
    hideResults();
    setStatus('Listo.', '');
  });

  els.btnSubmit.addEventListener('click', onSubmit);

  async function onSubmit() {
    hideClientError();
    hideResults();

    let matrix;
    try {
      matrix = parseMatrix(els.matrixInput.value);
    } catch (err) {
      showClientError(err.message);
      return;
    }

    setLoading(true);
    setStatus('Calculando factorización QR…', 'loading');

    try {
      const data = await requestQRFactorization(matrix);
      renderResults(data);
      setStatus('Operación completada.', 'success');
    } catch (err) {
      setStatus(err.message || 'Error al procesar la solicitud.', 'error');
    } finally {
      setLoading(false);
    }
  }

  function parseMatrix(raw) {
    const trimmed = raw.trim();
    if (!trimmed) throw new Error('La matriz no puede estar vacía');
    if (trimmed.startsWith('[')) return parseJsonMatrix(trimmed);
    return parseLineMatrix(trimmed);
  }

  function parseJsonMatrix(text) {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error('JSON inválido. Usa el formato [[1,2],[3,4]]');
    }
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('La matriz debe ser un arreglo no vacío');
    }
    const matrix = parsed.map((row, i) => {
      if (!Array.isArray(row) || row.length === 0) throw new Error(`Fila ${i + 1} inválida`);
      return row.map((cell, j) => toNumber(cell, i, j));
    });
    assertRectangular(matrix);
    return matrix;
  }

  function parseLineMatrix(text) {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) throw new Error('Ingresa al menos una fila');
    const matrix = lines.map((line, i) => {
      const parts = line.split(/[\s,;]+/).filter(Boolean);
      if (parts.length === 0) throw new Error(`Fila ${i + 1} vacía`);
      return parts.map((p, j) => toNumber(p, i, j));
    });
    assertRectangular(matrix);
    return matrix;
  }

  function toNumber(value, row, col) {
    if (value === null || value === undefined || value === '') {
      throw new Error(`Valor nulo en fila ${row + 1}, columna ${col + 1}`);
    }
    const n = Number(value);
    if (!Number.isFinite(n)) {
      throw new Error(`Número inválido en fila ${row + 1}, columna ${col + 1}`);
    }
    return n;
  }

  function assertRectangular(matrix) {
    const cols = matrix[0].length;
    for (let i = 1; i < matrix.length; i += 1) {
      if (matrix[i].length !== cols) {
        throw new Error('La matriz debe ser rectangular (mismas columnas en cada fila)');
      }
    }
  }

  function formatNumber(n) {
    if (Number.isInteger(n)) return String(n);
    return n.toFixed(6).replace(/\.?0+$/, '');
  }

  async function requestQRFactorization(matrix) {
    const authHeaders = InterseguroAuth.getAuthHeaders();
    if (!authHeaders.Authorization) {
      InterseguroAuth.handleUnauthorized();
      throw new Error('No hay sesión activa. Inicia sesión nuevamente.');
    }

    const url = `${config.goApiBaseUrl}${config.qrPath}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify({ matrix }),
    });

    let body;
    try {
      body = await response.json();
    } catch {
      throw new Error('Respuesta inválida del servidor');
    }

    if (response.status === 401) {
      InterseguroAuth.handleUnauthorized();
      throw new Error('Sesión expirada. Inicia sesión nuevamente.');
    }

    if (!response.ok || !body.success) {
      throw new Error(body.message || `Error HTTP ${response.status}`);
    }

    return body.data;
  }

  function renderResults(data) {
    els.matrixQ.innerHTML = renderMatrixTable(data.q || []);
    els.matrixR.innerHTML = renderMatrixTable(data.r || []);
    els.statistics.innerHTML = renderStatistics(data.statistics || {});
    els.results.hidden = false;
  }

  function renderStatistics(stats) {
    const items = [
      {
        label: 'Valor máximo',
        hint: 'El valor máximo encontrado en las matrices.',
        value: formatStatNumber(stats.max),
      },
      {
        label: 'Valor mínimo',
        hint: 'El valor mínimo encontrado en las matrices.',
        value: formatStatNumber(stats.min),
      },
      {
        label: 'Promedio',
        hint: 'El promedio de todos los valores de las matrices.',
        value: formatStatNumber(stats.average),
      },
      {
        label: 'Suma total',
        hint: 'La suma total de todos los valores de las matrices.',
        value: formatStatNumber(stats.sum),
      },
      {
        label: 'Matriz diagonal',
        hint: 'Verificar si alguna matriz es diagonal.',
        value: formatBoolean(stats.isDiagonal),
      },
    ];

    return items
      .map(
        (item) =>
          `<dt title="${escapeAttr(item.hint)}">${item.label}</dt>` +
          `<dd>${item.value}</dd>`
      )
      .join('');
  }

  function formatStatNumber(value) {
    if (value === null || value === undefined || !Number.isFinite(value)) return '—';
    return formatNumber(value);
  }

  function formatBoolean(value) {
    if (value === null || value === undefined) return '—';
    return value ? 'Sí' : 'No';
  }

  function escapeAttr(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;');
  }

  function renderMatrixTable(matrix) {
    if (!matrix.length) return '<p class="hint">Sin datos</p>';
    const cols = matrix[0].length;
    let html = '<table><thead><tr>';
    for (let c = 0; c < cols; c += 1) html += `<th>c${c + 1}</th>`;
    html += '</tr></thead><tbody>';
    matrix.forEach((row) => {
      html += '<tr>';
      row.forEach((cell) => {
        html += `<td>${formatNumber(cell)}</td>`;
      });
      html += '</tr>';
    });
    html += '</tbody></table>';
    return html;
  }

  function setLoading(loading) {
    els.btnSubmit.disabled = loading;
    els.btnSample.disabled = loading;
    els.btnClear.disabled = loading;
  }

  function setStatus(text, variant) {
    els.status.textContent = text;
    els.status.className = variant ? `status ${variant}` : 'status';
  }

  function showClientError(message) {
    els.clientError.textContent = message;
    els.clientError.hidden = false;
  }

  function hideClientError() {
    els.clientError.hidden = true;
    els.clientError.textContent = '';
  }

  function hideResults() {
    els.results.hidden = true;
  }
})();
