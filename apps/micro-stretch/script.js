// ===========================
// Micro Stretch - script
// ===========================

const STORAGE_KEY = 'microStretch:records:v1';

// Fixed, hardcoded stretch list (not user-editable, not stored in localStorage)
const STRETCHES = [
  {
    name: 'Shoulder rolls',
    duration: '30 sec',
    steps: ['Sit or stand tall', 'Roll shoulders forward 5 times', 'Roll shoulders backward 5 times']
  },
  {
    name: 'Neck side stretch',
    duration: '20 sec',
    steps: ['Sit or stand tall', 'Tilt head toward one shoulder gently', 'Hold, then switch sides']
  },
  {
    name: 'Wrist and finger stretch',
    duration: '20 sec',
    steps: ['Extend one arm forward, palm up', 'Gently pull fingers back with other hand', 'Hold, then switch hands']
  },
  {
    name: 'Seated spinal twist',
    duration: '30 sec',
    steps: ['Sit tall with feet flat on floor', 'Twist upper body to one side, hand on chair back', 'Hold, then twist to the other side']
  },
  {
    name: 'Standing forward fold',
    duration: '30 sec',
    steps: ['Stand with feet hip-width apart', 'Hinge at hips and let arms hang toward the floor', 'Relax neck and hold']
  },
  {
    name: 'Calf raises',
    duration: '20 reps',
    steps: ['Stand with feet hip-width apart', 'Rise up onto your toes', 'Lower slowly and repeat']
  },
  {
    name: 'Ankle circles',
    duration: '20 sec',
    steps: ['Lift one foot slightly off the floor', 'Rotate ankle in circles', 'Switch direction, then switch feet']
  },
  {
    name: 'Chest opener stretch',
    duration: '20 sec',
    steps: ['Clasp hands behind your back', 'Straighten arms and lift chest', 'Hold and breathe']
  },
  {
    name: 'Standing side bend',
    duration: '20 sec',
    steps: ['Stand with feet hip-width apart', 'Raise one arm overhead and lean sideways', 'Hold, then switch sides']
  },
  {
    name: 'Deep breathing (box breathing)',
    duration: '1 min',
    steps: ['Inhale slowly for 4 counts', 'Hold for 4 counts', 'Exhale slowly for 4 counts, repeat']
  },
  {
    name: 'Standing quad stretch',
    duration: '20 sec each leg',
    steps: ['Stand tall, hold onto something for balance', 'Bend one knee and grab your ankle behind you', 'Hold, then switch legs']
  },
  {
    name: 'Cat-cow stretch',
    duration: '30 sec',
    steps: ['Place hands on a desk or chair, hinge forward', 'Arch your back and look up', 'Round your back and tuck chin, repeat']
  },
  {
    name: 'Neck forward and back tilt',
    duration: '20 sec',
    steps: ['Sit or stand tall', 'Gently tilt chin toward chest', 'Slowly tilt head back and look up']
  },
  {
    name: 'Shoulder blade squeeze',
    duration: '15 reps',
    steps: ['Sit or stand with arms relaxed', 'Squeeze shoulder blades together', 'Release slowly and repeat']
  },
  {
    name: 'Toe touches',
    duration: '20 sec',
    steps: ['Stand with feet hip-width apart', 'Slowly reach toward your toes', 'Hold, keeping knees soft']
  },
  {
    name: 'Hip circles',
    duration: '20 sec',
    steps: ['Stand with hands on hips', 'Rotate hips in a circle', 'Switch direction halfway through']
  },
  {
    name: 'Arm circles',
    duration: '20 sec',
    steps: ['Extend both arms out to the sides', 'Make small circles forward', 'Reverse direction halfway through']
  },
  {
    name: 'Standing torso twist',
    duration: '20 sec',
    steps: ['Stand with feet hip-width apart', 'Twist upper body side to side', 'Let arms swing loosely']
  },
  {
    name: '20-20-20 eye rest',
    duration: '20 sec',
    steps: ['Look away from your screen', 'Focus on something 20 feet away', 'Hold for 20 seconds']
  },
  {
    name: 'Jaw and face relax stretch',
    duration: '15 sec',
    steps: ['Open your mouth wide', 'Move jaw gently side to side', 'Relax face muscles and breathe']
  }
];

// Index of the stretch currently shown (null = none shown yet)
let currentIndex = null;

// -----------------------
// Date helpers
// -----------------------

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

function todayStr() {
  return formatDate(new Date());
}

// -----------------------
// localStorage read/write
// -----------------------

function getRecords() {
  const raw = localStorage.getItem(STORAGE_KEY);
  let records;

  if (!raw) {
    records = { date: todayStr(), todayCount: 0, totalCount: 0 };
  } else {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        records = {
          date: typeof parsed.date === 'string' ? parsed.date : todayStr(),
          todayCount: Number.isFinite(parsed.todayCount) ? parsed.todayCount : 0,
          totalCount: Number.isFinite(parsed.totalCount) ? parsed.totalCount : 0
        };
      } else {
        records = { date: todayStr(), todayCount: 0, totalCount: 0 };
      }
    } catch {
      records = { date: todayStr(), todayCount: 0, totalCount: 0 };
    }
  }

  return normalizeRecords(records);
}

// If the stored date isn't today, reset todayCount but keep totalCount
function normalizeRecords(records) {
  const today = todayStr();
  if (records.date !== today) {
    records.date = today;
    records.todayCount = 0;
  }
  return records;
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

// -----------------------
// Init
// -----------------------

document.addEventListener('DOMContentLoaded', function () {
  const records = getRecords();
  saveRecords(records); // persist normalized date/counts
  renderRecords(records);

  document.getElementById('showStretchBtn').addEventListener('click', handleShow);
  document.getElementById('anotherBtn').addEventListener('click', handleAnother);
  document.getElementById('doneBtn').addEventListener('click', handleDone);
});

// -----------------------
// Records rendering
// -----------------------

function renderRecords(records) {
  document.getElementById('todayRecord').textContent = 'Today: ' + records.todayCount;
  document.getElementById('totalRecord').textContent = 'Total: ' + records.totalCount;
}

// -----------------------
// Stretch picking / rendering
// -----------------------

// Picks a random index, avoiding excludeIndex when there's more than 1 stretch
function pickRandomIndex(excludeIndex) {
  if (STRETCHES.length <= 1) return 0;
  let idx;
  do {
    idx = Math.floor(Math.random() * STRETCHES.length);
  } while (idx === excludeIndex);
  return idx;
}

function renderStretch(index) {
  const stretch = STRETCHES[index];
  document.getElementById('stretchName').textContent = stretch.name;
  document.getElementById('stretchDuration').textContent = stretch.duration;

  const stepsList = document.getElementById('stretchSteps');
  stepsList.replaceChildren();
  stretch.steps.forEach(function (step) {
    const li = document.createElement('li');
    li.textContent = step;
    stepsList.appendChild(li);
  });

  document.getElementById('stretchCard').hidden = false;
  document.getElementById('stretchActions').hidden = false;
  document.getElementById('doneConfirmation').hidden = true;
}

function handleShow() {
  currentIndex = pickRandomIndex(null);
  renderStretch(currentIndex);
}

function handleAnother() {
  currentIndex = pickRandomIndex(currentIndex);
  renderStretch(currentIndex);
}

function handleDone() {
  const records = getRecords();
  records.todayCount += 1;
  records.totalCount += 1;
  saveRecords(records);
  renderRecords(records);

  document.getElementById('doneConfirmation').hidden = false;
}
