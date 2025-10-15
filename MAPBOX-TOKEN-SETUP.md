# 🗺️ Cómo Obtener un Token de Mapbox

## Pasos para Crear tu Propio Token

### 1. Crear una Cuenta en Mapbox (GRATIS)
- Ve a: https://account.mapbox.com/auth/signup/
- Regístrate con tu email
- El plan gratuito incluye **50,000 cargas de mapa por mes** (más que suficiente)

### 2. Acceder a tus Tokens
- Ve a: https://account.mapbox.com/access-tokens/
- Verás tu **token por defecto** (público)

### 3. Crear un Nuevo Token
1. Click en **"Create a token"**
2. Dale un nombre descriptivo: `SCROLLAMA-PROJECT`
3. **Selecciona estos scopes:**
   - ✅ `styles:tiles` - Para cargar las tiles del mapa
   - ✅ `styles:read` - Para leer estilos
   - ✅ `fonts:read` - Para fuentes del mapa
   - ✅ `datasets:read` - Para datasets

4. **URL Restrictions (Opcional pero recomendado):**
   - Añade tu dominio: `https://joangonzalez02.github.io/*`
   - Para desarrollo local: `http://localhost:*`

5. Click en **"Create token"**
6. **Copia el token** (empieza con `pk.`)

### 4. Reemplazar el Token en el Proyecto

Busca en el archivo `mapbox-integration.js` la línea:
```javascript
const mapboxAccessToken = 'pk.eyJ1IjoibWFwYm94...';
```

Y reemplázala con tu nuevo token:
```javascript
const mapboxAccessToken = 'TU_NUEVO_TOKEN_AQUI';
```

Luego ejecuta:
```bash
npm run build
```

## ¿El mapa sigue sin verse?
Si después de cambiar el token el mapa sigue sin verse:
1. Verifica que hayas ejecutado `npm run build`
2. Limpia la caché del navegador (Ctrl + Shift + R)
3. Verifica que el token tenga los scopes correctos
4. Revisa la consola para otros errores

## Costos (Tranquilo, es GRATIS para tu uso)
- **Plan Gratuito:** 50,000 cargas/mes
- **Tu sitio probablemente usará:** < 1,000/mes
- **Costo:** $0 💰

---

**Próximos Pasos:**
4. 📝 Consigue tu propio token para producción
