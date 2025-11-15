


const express = require("express");
const fs = require("fs").promises;
const app = express();

app.use(express.json());

// ------------------ FUNCIONES AUXILIARES ------------------

async function readJSON(filename) {
  const data = await fs.readFile(filename, "utf8");
  return JSON.parse(data);
}

async function writeJSON(filename, data) {
  await fs.writeFile(filename, JSON.stringify(data, null, 2), "utf8");
}

// ------------------ PACIENTES ------------------

// POST /pacientes - Registrar nuevo paciente
app.post("/pacientes", async (req, res) => {
  try {
    const pacientes = await readJSON("./data/pacientes.json");
    const nuevo = req.body;

if (
  nuevo.id == null ||
  nuevo.nombre == null ||
  nuevo.edad == null ||
  nuevo.telefono == null ||
  nuevo.email == null) 
  {return res.status(400).json({ error: "Faltan datos obligatorios" });}
    // ID único
    if (pacientes.some(p => p.id === nuevo.id)) {
      return res.status(400).json({ error: "El ID ya existe" });
    }

    if (pacientes.some(p => p.email === nuevo.email)) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    if (nuevo.edad <= 0) {
      return res.status(400).json({ error: "La edad debe ser mayor a 0" });
    }

    nuevo.fechaRegistro = new Date().toISOString().split("T")[0];
    pacientes.push(nuevo);
    await writeJSON("./data/pacientes.json", pacientes);
    res.status(201).json(nuevo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al registrar paciente" });
  }
});

// GET /pacientes - Listar todos
app.get("/pacientes", async (req, res) => {
  try {
    const pacientes = await readJSON("./data/pacientes.json");
    res.json(pacientes);
  } catch {
    res.status(500).json({ error: "Error al leer pacientes" });
  }
});

// GET /pacientes/:id - Obtener por ID
app.get("/pacientes/:id", async (req, res) => {
  try {
    const pacientes = await readJSON("./data/pacientes.json");
    const paciente = pacientes.find(p => p.id === req.params.id);
    if (!paciente) return res.status(404).json({ error: "Paciente no encontrado" });
    res.json(paciente);
  } catch {
    res.status(500).json({ error: "Error al leer paciente" });
  }
});

// PUT /pacientes/:id - Actualizar datos
app.put("/pacientes/:id", async (req, res) => {
  try {
    const pacientes = await readJSON("./data/pacientes.json");
    const idx = pacientes.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Paciente no encontrado" });

    const { id, ...actualizaciones } = req.body; // bloqueamos cambios de id
    if (actualizaciones.edad && actualizaciones.edad <= 0) {
      return res.status(400).json({ error: "La edad debe ser mayor a 0" });
    }

    pacientes[idx] = { ...pacientes[idx], ...actualizaciones };
    await writeJSON("./data/pacientes.json", pacientes);
    res.json(pacientes[idx]);
  } catch {
    res.status(500).json({ error: "Error al actualizar paciente" });
  }
});

// GET /pacientes/:id/historial - Ver historial de citas
app.get("/pacientes/:id/historial", async (req, res) => {
  try {
    const pacientes = await readJSON("./data/pacientes.json");
    const paciente = pacientes.find(p => p.id === req.params.id);
    if (!paciente) return res.status(404).json({ error: "Paciente no encontrado" });

    const citas = await readJSON("./data/citas.json");
    const historial = citas.filter(c => c.pacienteId === req.params.id);

    if (historial.length === 0) {
      return res.json({ mensaje: "No hay historial de citas" });
    }

    res.json(historial);
  } catch {
    res.status(500).json({ error: "Error al leer historial" });
  }
});


// ------------------ DOCTORES ------------------

// Días válidos
const DIAS_VALIDOS = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];

// POST /doctores - Registrar nuevo doctor
app.post("/doctores", async (req, res) => {
  try {
    const doctores = await readJSON("./data/doctores.json");
    const nuevo = req.body;

    if (!nuevo.id || !nuevo.nombre || !nuevo.especialidad || !nuevo.horarioInicio || !nuevo.horarioFin || !nuevo.diasDisponibles) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

     // Validar que diasDisponibles sea un array no vacío
    if (!Array.isArray(nuevo.diasDisponibles) || nuevo.diasDisponibles.length === 0) {
      return res.status(400).json({ error: "Debe especificar al menos un día disponible" });
    }

    // Validar que todos los días sean válidos
    const diasInvalidos = nuevo.diasDisponibles.filter(d => !DIAS_VALIDOS.includes(d));
    if (diasInvalidos.length > 0) {
      return res.status(400).json({ error: `Días inválidos: ${diasInvalidos.join(", ")}` });
    }

    if (doctores.some(d => d.nombre === nuevo.nombre && d.especialidad === nuevo.especialidad)) {
      return res.status(400).json({ error: "Ya existe un doctor con ese nombre y especialidad" });
    }

    if (nuevo.horarioInicio >= nuevo.horarioFin) {
      return res.status(400).json({ error: "El horario de inicio debe ser menor al fin" });
    }

    doctores.push(nuevo);
    await writeJSON("./data/doctores.json", doctores);
    res.status(201).json(nuevo);
  } catch {
    res.status(500).json({ error: "Error al registrar doctor" });
  }
  
});

// GET /doctores - Listar todos
app.get("/doctores", async (req, res) => {
  try {
    const doctores = await readJSON("./data/doctores.json");
    res.json(doctores);
  } catch {
    res.status(500).json({ error: "Error al leer doctores" });
  }
});

// GET /doctores/:id - Obtener por ID
app.get("/doctores/:id", async (req, res) => {
  try {
    const doctores = await readJSON("./data/doctores.json");
    const doctor = doctores.find(d => d.id === req.params.id);
    if (!doctor) return res.status(404).json({ error: "Doctor no encontrado" });
    res.json(doctor);
  } catch {
    res.status(500).json({ error: "Error al leer doctor" });
  }
});

// GET /doctores/especialidad/:esp - Buscar por especialidad
app.get("/doctores/especialidad/:esp", async (req, res) => {
  try {
    const doctores = await readJSON("./data/doctores.json");
    const filtrados = doctores.filter(d => d.especialidad.toLowerCase() === req.params.esp.toLowerCase());
    res.json(filtrados);
  } catch {
    res.status(500).json({ error: "Error al buscar doctores" });
  }
});

// ------------------ CITAS ------------------



// CREAR cita
app.post("/citas", async (req, res) => {
  try {
    const citas = await readJSON("./data/citas.json");
    const pacientes = await readJSON("./data/pacientes.json");
    const doctores = await readJSON("./data/doctores.json");
    const nueva = req.body;

    // Validar campos obligatorios
    if (!nueva.id || !nueva.pacienteId || !nueva.doctorId || !nueva.fecha || !nueva.hora) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    // Validar paciente existente
    if (!pacientes.find(p => p.id === nueva.pacienteId)) {
      return res.status(400).json({ error: "El paciente no existe" });
    }

    // Validar doctor existente
    const doctor = doctores.find(d => d.id === nueva.doctorId);
    if (!doctor) {
      return res.status(400).json({ error: "El doctor no existe" });
    }

    // Validar fecha y hora futura
    const fechaCita = new Date(`${nueva.fecha}T${nueva.hora}`);
    const ahora = new Date();
    if (fechaCita <= ahora) return res.status(400).json({ error: "La fecha y hora deben ser futuras" });

    // Validar que el doctor esté disponible ese día
    const dias = ["Domingo","Lunes","Martes","Miercoles","Jueves","Viernes","Sabado"];
    const diaCita = dias[fechaCita.getDay()];
    if (!doctor.diasDisponibles.includes(diaCita)) {
      return res.status(400).json({ error: `El doctor no está disponible el día ${diaCita}` });
    }

    // Validar hora dentro del horario del doctor
    const [hInicio, mInicio] = doctor.horarioInicio.split(":").map(Number);
    const [hFin, mFin] = doctor.horarioFin.split(":").map(Number);
    const [hCita, mCita] = nueva.hora.split(":").map(Number);

    const minutosInicio = hInicio * 60 + mInicio;
    const minutosFin = hFin * 60 + mFin;
    const minutosCita = hCita * 60 + mCita;

    if (minutosCita < minutosInicio || minutosCita >= minutosFin) {
      return res.status(400).json({ error: `La hora debe estar entre ${doctor.horarioInicio} y ${doctor.horarioFin}` });
    }

    // Validar disponibilidad: mismo doctor, misma fecha y misma hora
    const fechaStr = fechaCita.toISOString().split("T")[0];
    if (citas.some(c => 
      c.doctorId === nueva.doctorId &&
      new Date(c.fecha).toISOString().split("T")[0] === fechaStr &&
      c.hora === nueva.hora
    )) {
      return res.status(400).json({ error: "El doctor ya tiene una cita en esa hora" });
    }

    // Guardar cita
    nueva.estado = "programada";
    citas.push(nueva);
    await writeJSON("./data/citas.json", citas);
    res.status(201).json(nueva);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear cita" });
  }
});

// GET /citas - Ver todas las citas
app.get("/citas", async (req, res) => {
  try {
    const citas = await readJSON("./data/citas.json");

    if (citas.length === 0) {
      return res.json({ mensaje: "No hay citas registradas" });
    }

    res.json(citas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al leer las citas" });
  }
});

// GET /citas/:id
app.get("/citas/:id", async (req, res) => {
  try {
    const citas = await readJSON("./data/citas.json");
    const cita = citas.find(c => c.id === req.params.id);
    if (!cita) return res.status(404).json({ error: "Cita no encontrada" });
    res.json(cita);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al leer la cita" });
  }
});


// PUT /citas/:id/cancelar - Cancelar una cita
app.put("/citas/:id/cancelar", async (req, res) => {
  try {
    const citas = await readJSON("./data/citas.json");
    const idx = citas.findIndex(c => c.id === req.params.id);

    if (idx === -1) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }

    // Solo se pueden cancelar citas programadas
    if (citas[idx].estado !== "programada") {
      return res.status(400).json({ error: "Solo se pueden cancelar citas programadas" });
    }

    // Cambiar estado a cancelada
    citas[idx].estado = "cancelada";
    await writeJSON("./data/citas.json", citas);

    res.json(citas[idx]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al cancelar cita" });
  }
});



//------------------💡 Funcionalidades --------------------
// GET /estadisticas/doctores
app.get("/estadisticas/doctores", async (req, res) => {
  try {
    const citas = await readJSON("./data/citas.json");
    const doctores = await readJSON("./data/doctores.json");

    const conteo = {};
    doctores.forEach(d => { conteo[d.id] = 0; }); // Inicializa todos en 0

    citas.forEach(c => {
      if (c.estado === "programada" && conteo[c.doctorId] !== undefined) {
        conteo[c.doctorId] += 1;
      }
    });

    // Mapear a un array de doctores con sus citas
    const resultado = doctores.map(d => ({
      doctor: d,
      citas: conteo[d.id]
    }));

    res.json(resultado);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al calcular estadísticas" });
  }
});


// GET /estadisticas/especialidades
app.get("/estadisticas/especialidades", async (req, res) => {
  try {
    const citas = await readJSON("./data/citas.json");
    const doctores = await readJSON("./data/doctores.json");

    const conteo = {};
    citas.forEach(c => {
      if (c.estado === "programada") {
        const doctor = doctores.find(d => d.id === c.doctorId);
        if (doctor) {
          conteo[doctor.especialidad] = (conteo[doctor.especialidad] || 0) + 1;
        }
      }
    });

    let maxSolicitada = null;
    let maxCitas = 0;
    for (const [esp, cant] of Object.entries(conteo)) {
      if (cant > maxCitas) {
        maxCitas = cant;
        maxSolicitada = esp;
      }
    }

    res.json({
      especialidad: maxSolicitada,
      citas: maxCitas
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al calcular especialidad más solicitada" });
  }
});

// GET /citas?fecha=YYYY-MM-DD&estado=programada
app.get("/doctores/disponibles", async (req, res) => {
  try {
    const { fecha, hora } = req.query;
    if (!fecha || !hora) return res.status(400).json({ error: "Falta fecha u hora" });

    const doctores = await readJSON("./data/doctores.json");
    const citas = await readJSON("./data/citas.json");

    const fechaCita = new Date(`${fecha}T${hora}`);
    const dias = ["Domingo","Lunes","Martes","Miercoles","Jueves","Viernes","Sabado"];
    const diaCita = dias[fechaCita.getDay()];

    const disponibles = doctores.filter(d => {
      // Día disponible (normalizado)
      const diasDoc = d.diasDisponibles.map(x => x.toLowerCase().trim());
      if (!diasDoc.includes(diaCita.toLowerCase())) return false;

      // Horario disponible
      const [hInicio, mInicio] = d.horarioInicio.split(":").map(Number);
      let [hFin, mFin] = d.horarioFin.split(":").map(Number);
      if (hFin === 24) hFin = 23;  // Ajuste para JS
      const minutosInicio = hInicio * 60 + mInicio;
      const minutosFin = hFin * 60 + mFin;
      const [hCita, mCita] = hora.split(":").map(Number);
      const minutosCita = hCita * 60 + mCita;

      if (minutosCita < minutosInicio || minutosCita >= minutosFin) return false;

      // Verificar si doctor ya tiene cita
      const ocupado = citas.some(c => 
        c.doctorId === d.id &&
        c.fecha === fecha &&
        c.hora === hora &&
        c.estado === "programada"
      );
      return !ocupado;
    });

    res.json(disponibles);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al buscar doctores disponibles" });
  }
});



// GET /citas/proximas
app.get("/citas/proximas", async (req, res) => {
  try {
    const citas = await readJSON("./data/citas.json");
    const ahora = new Date();
    const fin = new Date(ahora.getTime() + 24 * 60 * 60 * 1000); // 24 horas

    const proximas = citas.filter(c => {
      const fechaCita = new Date(`${c.fecha}T${c.hora}`);
      return c.estado === "programada" && fechaCita >= ahora && fechaCita <= fin;
    });

    res.json(proximas);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener citas próximas" });
  }
});




// ------------------ INICIO DEL SERVIDOR ------------------

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
