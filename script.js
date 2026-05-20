// ==================== DATA ====================
let jobdeskData = [];
let rencanaKerja = { m8: "", m9: "", m10: "", m11: "", m12: "", m13: "", m14: "" };
let unsubscribeJobdesk = null;

// ==================== DEADLINE ====================
function hitungSisaHari() {
    const targetDate = new Date(2026, 6, 12);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
}

function updateDeadline() {
    const sisaHari = hitungSisaHari();
    const deadlineElement = document.getElementById("deadlineCount");
    if (deadlineElement) {
        deadlineElement.innerText = sisaHari + " Hari Lagi";
    }
}

function saveRencanaKerja() {
    localStorage.setItem("pbl_rencana_kerja", JSON.stringify(rencanaKerja));
}

function loadRencanaKerja() {
    const stored = localStorage.getItem("pbl_rencana_kerja");
    if (stored) {
        rencanaKerja = JSON.parse(stored);
    }
}

// ==================== FIRESTORE ====================
function listenJobdesk() {
    if (unsubscribeJobdesk) unsubscribeJobdesk();
    
    const jobdeskCollection = window.collection(window.db, "jobdesk");
    
    unsubscribeJobdesk = window.onSnapshot(jobdeskCollection, (snapshot) => {
        jobdeskData = [];
        snapshot.forEach((doc) => {
            jobdeskData.push({ id: doc.id, ...doc.data() });
        });
        jobdeskData.sort((a, b) => a.nama?.localeCompare(b.nama) || 0);
        
        renderFullJobdesk();
        renderAnggota();
        updateStats();
        console.log("Data dari Firebase:", jobdeskData.length, "jobdesk");
    }, (error) => {
        console.error("Error:", error);
    });
}

// ==================== CRUD FIREBASE ====================
async function tambahJobdesk() {
    const picInput = document.getElementById("namaAnggota")?.value.trim();
    const jenis = document.getElementById("jenisPekerjaan")?.value.trim();
    const detail = document.getElementById("detailTugas")?.value.trim();
    
    if (!picInput || !jenis || !detail) {
        alert("Harap isi semua field!");
        return;
    }
    
    try {
        await window.addDoc(window.collection(window.db, "jobdesk"), {
            nama: jenis,
            detail: detail,
            pic: picInput.split(",").map(p => p.trim()),
            catatan: "",
            createdAt: new Date().toISOString()
        });
        document.getElementById("namaAnggota").value = "";
        document.getElementById("jenisPekerjaan").value = "";
        document.getElementById("detailTugas").value = "";
        alert("Jobdesk berhasil ditambahkan!");
    } catch (error) {
        console.error(error);
        alert("Gagal menambahkan jobdesk!");
    }
}

async function editJob(jobId) {
    const job = jobdeskData.find(j => j.id === jobId);
    if (!job) return;
    
    const newNama = prompt("Edit Jobdesk:", job.nama);
    if (!newNama?.trim()) return;
    const newDetail = prompt("Edit Detail Tugas:", job.detail);
    if (!newDetail?.trim()) return;
    const newPic = prompt("Edit PIC (pisah koma):", job.pic.join(", "));
    if (!newPic?.trim()) return;
    
    try {
        const jobRef = window.doc(window.db, "jobdesk", jobId);
        await window.updateDoc(jobRef, {
            nama: newNama,
            detail: newDetail,
            pic: newPic.split(",").map(p => p.trim())
        });
        alert("Jobdesk berhasil diperbarui!");
    } catch (error) {
        console.error(error);
        alert("Gagal memperbarui jobdesk!");
    }
}

async function deleteJob(jobId) {
    const job = jobdeskData.find(j => j.id === jobId);
    if (!confirm(`Hapus jobdesk "${job?.nama}"?`)) return;
    
    try {
        const jobRef = window.doc(window.db, "jobdesk", jobId);
        await window.deleteDoc(jobRef);
        alert("Jobdesk berhasil dihapus!");
    } catch (error) {
        console.error(error);
        alert("Gagal menghapus jobdesk!");
    }
}

async function saveNoteFromModal() {
    if (window.currentNoteId) {
        try {
            const jobRef = window.doc(window.db, "jobdesk", window.currentNoteId);
            await window.updateDoc(jobRef, { catatan: document.getElementById("noteText").value });
            alert("Catatan berhasil disimpan!");
            closeModal();
        } catch (error) {
            console.error(error);
            alert("Gagal menyimpan catatan!");
        }
    }
}

// ==================== RENDER FUNCTIONS ====================
function renderRencanaKerja() {
    const container = document.getElementById("rencanaContainer");
    if (!container) return;
    
    const mingguList = ["m8", "m9", "m10", "m11", "m12", "m13", "m14"];
    const mingguNama = ["Minggu 8", "Minggu 9", "Minggu 10", "Minggu 11", "Minggu 12", "Minggu 13", "Minggu 14"];
    
    let html = "";
    for (let i = 0; i < mingguList.length; i++) {
        html += '<div class="rencana-group">';
        html += '<div class="rencana-group-header" onclick="toggleRencanaGroup(this)">';
        html += '<div class="rencana-week">' + mingguNama[i] + '</div>';
        html += '<button class="btn-expand"><i class="fas fa-chevron-down"></i></button>';
        html += '</div>';
        html += '<div class="rencana-group-body">';
        html += '<textarea id="rencana_' + mingguList[i] + '" class="rencana-text" rows="3" placeholder="Tulis rencana pekerjaan...">' + escapeHtml(rencanaKerja[mingguList[i]] || "") + '</textarea>';
        html += '</div>';
        html += '</div>';
    }
    container.innerHTML = html;
}

function toggleRencanaGroup(element) {
    const group = element.closest('.rencana-group');
    const body = group.querySelector('.rencana-group-body');
    const icon = group.querySelector('.btn-expand i');
    if (body.style.display === "none") {
        body.style.display = "block";
        icon.className = "fas fa-chevron-down";
    } else {
        body.style.display = "none";
        icon.className = "fas fa-chevron-right";
    }
}

function simpanRencana() {
    const mingguList = ["m8", "m9", "m10", "m11", "m12", "m13", "m14"];
    mingguList.forEach(m => {
        const textarea = document.getElementById("rencana_" + m);
        if (textarea) rencanaKerja[m] = textarea.value;
    });
    saveRencanaKerja();
    renderTimelinePage();
    alert("Rencana pekerjaan berhasil disimpan!");
}

function renderFullJobdesk() {
    const container = document.getElementById("jobListFull");
    if (!container) return;
    container.innerHTML = "";
    
    for (const job of jobdeskData) {
        let picHtml = job.pic.map(p => '<span class="pic-badge"><i class="fas fa-user"></i> ' + escapeHtml(p) + '</span>').join("");
        const hasNote = job.catatan && job.catatan.trim() !== "";
        
        const card = document.createElement("div");
        card.className = "job-card";
        card.innerHTML = '<div class="job-header">' +
            '<div style="flex:1">' +
            '<div class="job-title">' +
            '<i class="fas fa-anchor"></i> ' + escapeHtml(job.nama) +
            '<button class="note-btn ' + (hasNote ? "has-note" : "") + '" onclick="openNoteModal(\'' + job.id + '\')">' +
            '<i class="fas ' + (hasNote ? "fa-pen" : "fa-pen-fancy") + '"></i> ' + (hasNote ? "Edit Catatan" : "Tambah Catatan") +
            '</button>' +
            '</div>' +
            '<div class="job-detail">' + escapeHtml(job.detail) + '</div>' +
            '<div class="pic-list">' + picHtml + '</div>' +
            (hasNote ? '<div class="note-display">📝 <strong>Catatan:</strong> ' + escapeHtml(job.catatan) + '</div>' : '') +
            '</div>' +
            '<div class="job-actions">' +
            '<button class="action-btn" onclick="editJob(\'' + job.id + '\')"><i class="fas fa-edit"></i> Edit</button>' +
            '<button class="action-btn danger" onclick="deleteJob(\'' + job.id + '\')"><i class="fas fa-trash"></i> Hapus</button>' +
            '</div>' +
            '</div>';
        container.appendChild(card);
    }
    document.getElementById("jobCount2").innerHTML = jobdeskData.length + " items";
}

function renderTimelinePage() {
    const container = document.getElementById("timelineDetailedTable");
    if (!container) return;
    
    const mingguList = ["m8", "m9", "m10", "m11", "m12", "m13", "m14"];
    const mingguNama = ["Minggu 8", "Minggu 9", "Minggu 10", "Minggu 11", "Minggu 12", "Minggu 13", "Minggu 14"];
    
    let html = '<div class="timeline-table-container"><table class="timeline-table"><thead><tr><th class="col-minggu">Minggu</th><th class="col-rencana">Rencana Pekerjaan</th></tr></thead><tbody>';
    for (let i = 0; i < mingguList.length; i++) {
        html += '<tr><td class="col-minggu"><strong>' + mingguNama[i] + '</strong></td><td class="col-rencana">' + escapeHtml(rencanaKerja[mingguList[i]] || "-") + '</td>' + '';
    }
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

function renderAnggota() {
    const container = document.getElementById("anggotaListFull");
    if (!container) return;
    
    const avatarList = [
        { bg: "linear-gradient(135deg, #3b82f6, #8b5cf6)", icon: "fas fa-user-astronaut" },
        { bg: "linear-gradient(135deg, #10b981, #34d399)", icon: "fas fa-user-ninja" },
        { bg: "linear-gradient(135deg, #f59e0b, #ef4444)", icon: "fas fa-user-secret" },
        { bg: "linear-gradient(135deg, #ec4899, #8b5cf6)", icon: "fas fa-user-graduate" },
        { bg: "linear-gradient(135deg, #06b6d4, #3b82f6)", icon: "fas fa-user-tie" },
        { bg: "linear-gradient(135deg, #8b5cf6, #ec4899)", icon: "fas fa-user-circle" }
    ];
    
    const anggotaMap = new Map();
    for (const job of jobdeskData) {
        for (const p of job.pic) {
            let nama = p.trim();
            if (!anggotaMap.has(nama)) anggotaMap.set(nama, []);
            anggotaMap.get(nama).push(job.nama);
        }
    }
    
    const sorted = Array.from(anggotaMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    if (sorted.length === 0) {
        container.innerHTML = '<div style="padding:40px;text-align:center;color:#64748b;"><i class="fas fa-users" style="font-size:48px;margin-bottom:16px;opacity:0.5;"></i><p>Belum ada anggota</p></div>';
        document.getElementById("anggotaCount").innerHTML = "0 anggota";
        return;
    }
    
    let idx = 0;
    let html = "";
    for (const [nama, tugas] of sorted) {
        const avatar = avatarList[idx % avatarList.length];
        html += '<div class="anggota-card">' +
            '<div class="anggota-avatar" style="background:' + avatar.bg + '"><i class="' + avatar.icon + '"></i></div>' +
            '<div class="anggota-info">' +
            '<h4>' + escapeHtml(nama) + '</h4>' +
            '<div class="anggota-tugas">' + tugas.map(t => '<span class="tugas-badge">' + escapeHtml(t) + '</span>').join("") + '</div>' +
            '<div class="anggota-stats"><span class="job-count"><i class="fas fa-briefcase"></i> ' + tugas.length + ' Jobdesk</span></div>' +
            '</div></div>';
        idx++;
    }
    container.innerHTML = html;
    document.getElementById("anggotaCount").innerHTML = sorted.length + " anggota";
}

function updateStats() {
    const anggotaSet = new Set();
    for (const job of jobdeskData) {
        for (const p of job.pic) anggotaSet.add(p.trim());
    }
    document.getElementById("totalAnggota").innerText = anggotaSet.size;
    document.getElementById("totalJob").innerText = jobdeskData.length;
    document.getElementById("persenProgress").innerText = "0%";
    document.getElementById("taskSelesai").innerText = "0";
}

// ==================== MODAL ====================
function openNoteModal(jobId) {
    const job = jobdeskData.find(j => j.id === jobId);
    if (job) {
        document.getElementById("noteJobTitle").innerHTML = '<i class="fas fa-briefcase"></i> ' + escapeHtml(job.nama);
        document.getElementById("noteText").value = job.catatan || "";
        document.getElementById("noteModal").style.display = "flex";
        window.currentNoteId = jobId;
    }
}

function closeModal() {
    document.getElementById("noteModal").style.display = "none";
    window.currentNoteId = null;
}

// ==================== NAVIGASI ====================
function navigateTo(page) {
    const pages = ["dashboardPage", "jobdeskPage", "timelinePage", "anggotaPage"];
    for (const p of pages) document.getElementById(p).style.display = "none";
    
    const title = document.getElementById("pageTitle");
    const subtitle = document.getElementById("pageSubtitle");
    
    if (page === "dashboard") {
        document.getElementById("dashboardPage").style.display = "block";
        title.innerText = "Dashboard";
        subtitle.innerText = "Kelola jobdesk dan rencana kerja";
        renderRencanaKerja();
        updateStats();
    } else if (page === "jobdesk") {
        document.getElementById("jobdeskPage").style.display = "block";
        title.innerText = "Jobdesk";
        subtitle.innerText = "Daftar semua tugas tim";
        renderFullJobdesk();
    } else if (page === "timeline") {
        document.getElementById("timelinePage").style.display = "block";
        title.innerText = "Timeline";
        subtitle.innerText = "Rencana pekerjaan per minggu (M8-M14)";
        renderTimelinePage();
    } else if (page === "anggota") {
        document.getElementById("anggotaPage").style.display = "block";
        title.innerText = "Anggota";
        subtitle.innerText = "Daftar anggota tim";
        renderAnggota();
    }
    
    document.querySelectorAll(".nav-item").forEach(item => {
        if (item.getAttribute("data-page") === page) item.classList.add("active");
        else item.classList.remove("active");
    });
    updateDeadline();
}

function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>]/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[m] || m));
}

// ==================== INIT ====================
document.addEventListener("DOMContentLoaded", () => {
    loadRencanaKerja();
    listenJobdesk();
    navigateTo("dashboard");
    updateDeadline();
    
    document.getElementById("btnTambah")?.addEventListener("click", tambahJobdesk);
    document.getElementById("simpanRencana")?.addEventListener("click", simpanRencana);
    document.querySelector(".close-modal")?.addEventListener("click", closeModal);
    document.getElementById("cancelNote")?.addEventListener("click", closeModal);
    document.getElementById("saveNote")?.addEventListener("click", saveNoteFromModal);
    
    window.addEventListener("click", e => { if (e.target === document.getElementById("noteModal")) closeModal(); });
    document.querySelectorAll(".nav-item").forEach(item => {
        item.addEventListener("click", e => {
            e.preventDefault();
            navigateTo(item.getAttribute("data-page"));
        });
    });
    
    setInterval(updateDeadline, 3600000);
    
    window.editJob = editJob;
    window.deleteJob = deleteJob;
    window.openNoteModal = openNoteModal;
    window.toggleRencanaGroup = toggleRencanaGroup;
    window.simpanRencana = simpanRencana;
});