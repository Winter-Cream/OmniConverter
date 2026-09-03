// 10-Category Multi-Unit Converter Definition with Exact Mathematical Ratios

export const UNIT_CATEGORIES = {
  data: {
    name: "Data Storage",
    icon: "database",
    units: {
      b: { name: "Bits (b)", factor: 1 / 8 },
      B: { name: "Bytes (B)", factor: 1 },
      KB: { name: "Kilobytes (KB)", factor: 1024 },
      MB: { name: "Megabytes (MB)", factor: 1024 ** 2 },
      GB: { name: "Gigabytes (GB)", factor: 1024 ** 3 },
      TB: { name: "Terabytes (TB)", factor: 1024 ** 4 },
      PB: { name: "Petabytes (PB)", factor: 1024 ** 5 }
    }
  },
  length: {
    name: "Length & Distance",
    icon: "ruler",
    units: {
      mm: { name: "Millimeters (mm)", factor: 0.001 },
      cm: { name: "Centimeters (cm)", factor: 0.01 },
      m: { name: "Meters (m)", factor: 1 },
      km: { name: "Kilometers (km)", factor: 1000 },
      in: { name: "Inches (in)", factor: 0.0254 },
      ft: { name: "Feet (ft)", factor: 0.3048 },
      yd: { name: "Yards (yd)", factor: 0.9144 },
      mi: { name: "Miles (mi)", factor: 1609.344 },
      nm: { name: "Nautical Miles", factor: 1852 }
    }
  },
  weight: {
    name: "Weight & Mass",
    icon: "scale",
    units: {
      mg: { name: "Milligrams (mg)", factor: 0.000001 },
      g: { name: "Grams (g)", factor: 0.001 },
      kg: { name: "Kilograms (kg)", factor: 1 },
      ton: { name: "Metric Tonnes (t)", factor: 1000 },
      oz: { name: "Ounces (oz)", factor: 0.0283495 },
      lb: { name: "Pounds (lb)", factor: 0.453592 },
      st: { name: "Stone (st)", factor: 6.35029 }
    }
  },
  speed: {
    name: "Speed & Velocity",
    icon: "gauge",
    units: {
      mps: { name: "Meters / second (m/s)", factor: 1 },
      kph: { name: "Kilometers / hour (km/h)", factor: 1 / 3.6 },
      mph: { name: "Miles / hour (mph)", factor: 0.44704 },
      knot: { name: "Knots (kn)", factor: 0.514444 },
      mach: { name: "Mach (Standard Sea Level)", factor: 340.29 }
    }
  },
  temperature: {
    name: "Temperature",
    icon: "thermometer",
    custom: true,
    units: {
      C: { name: "Celsius (°C)" },
      F: { name: "Fahrenheit (°F)" },
      K: { name: "Kelvin (K)" }
    }
  },
  area: {
    name: "Area",
    icon: "square",
    units: {
      sq_m: { name: "Square Meters (m²)", factor: 1 },
      sq_km: { name: "Square Kilometers (km²)", factor: 1e6 },
      sq_cm: { name: "Square Centimeters (cm²)", factor: 0.0001 },
      sq_ft: { name: "Square Feet (ft²)", factor: 0.092903 },
      sq_yd: { name: "Square Yards (yd²)", factor: 0.836127 },
      acre: { name: "Acres", factor: 4046.86 },
      hectare: { name: "Hectares (ha)", factor: 10000 }
    }
  },
  volume: {
    name: "Volume",
    icon: "beaker",
    units: {
      ml: { name: "Milliliters (ml)", factor: 0.001 },
      l: { name: "Liters (L)", factor: 1 },
      cub_m: { name: "Cubic Meters (m³)", factor: 1000 },
      cup: { name: "Cups (US)", factor: 0.236588 },
      pt: { name: "Pints (US)", factor: 0.473176 },
      qt: { name: "Quarts (US)", factor: 0.946353 },
      gal: { name: "Gallons (US)", factor: 3.78541 }
    }
  },
  time: {
    name: "Time",
    icon: "clock",
    units: {
      ms: { name: "Milliseconds (ms)", factor: 0.001 },
      s: { name: "Seconds (s)", factor: 1 },
      min: { name: "Minutes (min)", factor: 60 },
      h: { name: "Hours (h)", factor: 3600 },
      d: { name: "Days (d)", factor: 86400 },
      wk: { name: "Weeks (wk)", factor: 604800 },
      yr: { name: "Years (365d)", factor: 31536000 }
    }
  },
  energy: {
    name: "Energy & Work",
    icon: "zap",
    units: {
      j: { name: "Joules (J)", factor: 1 },
      kj: { name: "Kilojoules (kJ)", factor: 1000 },
      cal: { name: "Calories (cal)", factor: 4.184 },
      kcal: { name: "Kilocalories (kcal)", factor: 4184 },
      wh: { name: "Watt-hours (Wh)", factor: 3600 },
      kwh: { name: "Kilowatt-hours (kWh)", factor: 3.6e6 },
      btu: { name: "British Thermal Units (BTU)", factor: 1055.06 }
    }
  },
  pressure: {
    name: "Pressure",
    icon: "wind",
    units: {
      pa: { name: "Pascals (Pa)", factor: 1 },
      kpa: { name: "Kilopascals (kPa)", factor: 1000 },
      bar: { name: "Bar", factor: 100000 },
      psi: { name: "Pounds per square inch (psi)", factor: 6894.76 },
      atm: { name: "Atmospheres (atm)", factor: 101325 },
      torr: { name: "Torr (mmHg)", factor: 133.322 }
    }
  }
};

export const convertUnits = (categoryKey, value, fromUnit, toUnit) => {
  const num = parseFloat(value);
  if (isNaN(num)) return "";

  if (fromUnit === toUnit) return num.toString();

  // Special Handling for Temperature
  if (categoryKey === "temperature") {
    let celsius = num;
    if (fromUnit === "F") celsius = (num - 32) * (5 / 9);
    else if (fromUnit === "K") celsius = num - 273.15;

    if (toUnit === "C") return Math.round(celsius * 10000) / 10000;
    if (toUnit === "F") return Math.round(((celsius * (9 / 5)) + 32) * 10000) / 10000;
    if (toUnit === "K") return Math.round((celsius + 273.15) * 10000) / 10000;
    return celsius;
  }

  const cat = UNIT_CATEGORIES[categoryKey];
  if (!cat || !cat.units[fromUnit] || !cat.units[toUnit]) return "";

  const baseValue = num * cat.units[fromUnit].factor;
  const converted = baseValue / cat.units[toUnit].factor;

  // Format nicely
  if (Math.abs(converted) < 0.0001 && converted !== 0) {
    return converted.toExponential(4);
  }
  return parseFloat(converted.toFixed(6)).toString();
};
