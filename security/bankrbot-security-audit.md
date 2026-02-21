# 🔒 Security Audit Report: BankrBot/openclaw-skills

**Fecha:** 2026-02-20  
**Auditor:** ClawdColombia Security Team  
**Repo:** https://github.com/BankrBot/openclaw-skills  
**Tipo:** Skills library para OpenClaw (cryp to/DeFi operations)

---

## 🎯 Resumen Ejecutivo

| Aspecto | Evaluación |
|---------|------------|
| **Propósito** | Librería de skills para operaciones DeFi/autónomas |
| **Riesgo General** | 🔴 **ALTO** - Manejo de fondos reales |
| **Licencia** | ❌ No especificada (repo sin LICENSE file) |
| **Actividad** | ✅ Activo (último commit: Feb 17, 2026) |
| **Recomendación** | ⚠️ Usar con precaución extrema |

---

## 🔍 Análisis por Skill

### 1. 💰 BANKR - Trading & DeFi Operations

**Funcionalidades:**
- Crypto trading (swaps, leverage)
- Token deployment (ERC20)
- Polymarket betting
- Portfolio management
- LLM gateway (paid API)

**Riesgos Identificados:**

| Riesgo | Severidad | Descripción |
|--------|-----------|-------------|
| **Fondos reales** | 🔴 CRÍTICO | Opera con wallets EVM + Solana reales |
| **API Key expuesta** | 🟡 MEDIO | Requiere `bk_...` API key con permisos de trading |
| **Sin sandbox** | 🔴 CRÍTICO | No hay modo test/demo mencionado |
| **Autonomous ops** | 🔴 CRÍTICO | "Sin intervención humana" en documentación |
| **LLM gateway** | 🟡 MEDIO | API de modelos cobrada por uso |

**Problemas de Seguridad:**
1. **No hay modo read-only por defecto** — requiere flag `--read-only` explícita
2. **Wallets auto-provisionadas** — crea wallets sin confirmación del usuario
3. **Términos de servicio** — aceptación requerida para operar
4. **Sin 2FA** — solo email OTP para login

---

### 2. 🪙 CLANKER - Token Deployment

**Funcionalidad:** Deploy ERC20 tokens en Base/EVM

**Riesgos:**
- Crea contratos en blockchain (irreversible)
- Costos de gas reales
- Sin validación de contratos antes de deploy

---

### 3. 💬 BOTCHAN - Onchain Messaging

**Funcionalidad:** Mensajería permanente en Base

**Riesgos:**
- Datos permanentes en blockchain (no se pueden borrar)
- Potencial fuga de información sensible

---

### 4. 🎭 VEIL - Privacy/Shielded Transactions

**Funcionalidad:** Transacciones privadas vía ZK proofs

**Riesgos:**
- Puede usarse para ofuscar origen de fondos
- Compliance/regulatorio

---

### 5. 🏦 ERC-8004 - Agent Registry

**Funcionalidad:** Registro de agentes como NFTs

**Riesgos:**
- Menor riesgo directo
- Gas costs para minting

---

## ⚠️ Red Flags Encontradas

### 🔴 Críticas

1. **Sin LICENSE file**
   - No se sabe bajo qué términos se puede usar/modificar
   - Riesgo legal para contribuciones

2. **Operaciones irreversibles**
   - Transacciones blockchain son permanentes
   - Un bug en el skill = pérdida de fondos

3. **Autonomous by design**
   - Documentación promete "sin intervención humana"
   - Esto es peligroso para trading/finanzas

4. **API externo (bankr.bot)**
   - Custodia de wallets por tercero
   - Si bankr.bot es comprometido, fondos en riesgo

### 🟡 Medias

5. **Sin tests de seguridad documentados**
   - No hay auditoría de contratos propios
   - No hay reportes de seguridad

6. **Dependencias de npm desconocidas**
   - `@bankr/cli` instala binarios sin source code visible

---

## ✅ Lo Positivo

| Aspecto | Descripción |
|---------|-------------|
| **Términos explícitos** | Requiere aceptación explícita de ToS |
| **Permisos granulares** | Distingue read-only vs read-write |
| **Headless login** | Bueno para agentes automatizados |
| **Documentación clara** | Buena explicación de riesgos en CLI setup |

---

## 🛡️ Recomendaciones de Uso Seguro

### Si decides usarlo:

1. **NUNCA uses en producción sin pruebas extensivas**
   - Crear wallet con fondos mínimos (<$10)
   - Probar cada operación manualmente primero
   - Verificar transacciones en explorer antes de confirmar

2. **Usa solo modo read-only inicialmente**
   ```bash
   bankr login email user@example.com --code XXX
   # Sin --read-write = solo lectura
   ```

3. **Monitoreo constante**
   - Alertas de transacciones inesperadas
   - Review semanal de operaciones

4. **Límites de gasto**
   - No conectes wallets con >$100 de valor
   - Usar wallets dedicadas exclusivamente

5. **No uses el LLM gateway sin entender costos**
   - Cada llamada tiene costo
   - Puede acumularse rápido

---

## 📊 Comparativa de Riesgo

| Skill | Riesgo Financiero | Riesgo de Datos | Riesgo Legal | Recomendación |
|-------|-------------------|-----------------|--------------|---------------|
| bankr | 🔴 CRÍTICO | 🟡 MEDIO | 🟡 MEDIO | ⚠️ Precaución extrema |
| clanker | 🔴 CRÍTICO | 🟢 BAJO | 🟢 BAJO | ⚠️ Probar en testnet |
| botchan | 🟢 BAJO | 🔴 CRÍTICO | 🟡 MEDIO | ⚠️ Cuidado con datos |
| veil | 🔴 CRÍTICO | 🟢 BAJO | 🔴 CRÍTICO | ❌ No recomendado |
| erc-8004 | 🟡 MEDIO | 🟢 BAJO | 🟢 BAJO | ✅ Aceptable |
| onchainkit | 🟢 BAJO | 🟢 BAJO | 🟢 BAJO | ✅ Seguro |

---

## 🎯 Veredicto Final

**¿Es seguro guardar como skill?**

| Contexto | Respuesta |
|----------|-----------|
| Producción con fondos reales | ❌ **NO** - Riesgo muy alto |
| Experimentación con <$10 | ⚠️ **Con precaución** |
| Solo lectura (read-only) | ✅ **Aceptable** |
| Enterprise/institutional | ❌ **NO** - Sin auditoría |

**El mayor riesgo:** Este skill está diseñado para operaciones financieras autónomas con fondos reales. Un bug o comportamiento inesperado del LLM podría resultar en pérdida total de fondos.

**Recomendación:** Si lo usas, hazlo con fondos mínimos de prueba y siempre con supervisión humana. No lo actives como "agente autónomo" sin límites claros.

---

*Auditoría realizada por ClawdColombia - Security Specialist | Verified ✅*
