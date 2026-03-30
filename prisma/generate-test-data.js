/**
 * Test data generator for Vision Aid reports page.
 * Run with: node prisma/generate-test-data.js
 *
 * Creates 30 beneficiaries + ~150 activity records across all 5 types
 * for whatever hospital(s) already exist in the DB.
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const padded = (n) => String(n).padStart(6, "0");

function randomDate(startYear = 2023, endYear = 2026) {
    const start = new Date(`${startYear}-01-01`);
    const end = new Date(`${endYear}-01-01`);
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomDOB() {
    // Ages 5 – 80
    const year = new Date().getFullYear() - rand(5, 80);
    return new Date(`${year}-${String(rand(1, 12)).padStart(2, "0")}-${String(rand(1, 28)).padStart(2, "0")}`);
}

const GENDERS = ["Male", "Female", "Other"];
const VISIONS = ["Blindness", "Severe visual impairment", "Moderate visual impairment", "Mild visual impairment"];
const MDVI_VALUES = ["Yes", "No"];
const DISTRICTS = ["North", "South", "East", "West", "Central"];
const STATES = ["Karnataka", "Tamil Nadu", "Maharashtra", "Gujarat", "Delhi"];
const DIAGNOSES = ["Cataract", "Glaucoma", "Diabetic Retinopathy", "Macular Degeneration", "Amblyopia"];
const COUNSELLING_TYPES = ["Other"];
const TRAINING_TYPES = ["Computer", "Mobile", "Orientation & Mobility Training", "Other"];
const TRAINING_SUBTYPES = {
    Computer: ["Certificate course in Computer Applications – CCA", "Other"],
    Mobile: ["Certificate course in Mobile technology - MT", "Other"],
    "Orientation & Mobility Training": ["Training for Eye-hand coordination", "Other"],
    Other: ["Braille training", "Other"],
};
const VA_CATEGORIES = [
    "Blindness",
    "Severe visual impairment",
    "Moderate visual impairment",
    "Mild visual impairment",
    "Visual Acuity normal",
];

async function main() {
    const hospitals = await prisma.hospital.findMany({ where: { deleted: false } });
    if (hospitals.length === 0) {
        console.error("No hospitals found. Run the seed first.");
        process.exit(1);
    }
    console.log(`Found ${hospitals.length} hospital(s): ${hospitals.map((h) => h.name).join(", ")}`);

    const BENEFICIARIES_PER_HOSPITAL = 30;
    const createdBeneficiaries = [];

    for (const hospital of hospitals) {
        console.log(`\nCreating ${BENEFICIARIES_PER_HOSPITAL} beneficiaries for "${hospital.name}" (id=${hospital.id})...`);
        for (let i = 1; i <= BENEFICIARIES_PER_HOSPITAL; i++) {
            const gender = pick(GENDERS);
            const mrn = `TEST-${hospital.id}-${padded(i)}`;

            try {
                const b = await prisma.beneficiary.create({
                    data: {
                        mrn,
                        hospitalId: hospital.id,
                        beneficiaryName: `Test Beneficiary ${hospital.id}-${padded(i)}`,
                        dateOfBirth: randomDOB(),
                        gender,
                        phoneNumber: `+91${rand(7000000000, 9999999999)}`,
                        education: pick(["None", "Primary", "Secondary", "Graduate"]),
                        occupation: pick(["Farmer", "Student", "Homemaker", "Business", "Unemployed"]),
                        districts: pick(DISTRICTS),
                        state: pick(STATES),
                        vision: pick(VISIONS),
                        mDVI: pick(MDVI_VALUES),
                        extraInformation: JSON.stringify({ extraField: "test" }),
                    },
                });
                createdBeneficiaries.push(b);
            } catch (e) {
                if (!e.message.includes("Unique constraint")) throw e;
            }
        }
        console.log(`  ✓ Beneficiaries created for ${hospital.name}`);
    }

    console.log(`\nTotal beneficiaries to seed activities for: ${createdBeneficiaries.length}`);

    console.log("\nCreating Vision Enhancement records...");
    for (const b of createdBeneficiaries) {
        const count = rand(1, 3);
        for (let s = 1; s <= count; s++) {
            await prisma.vision_Enhancement.create({
                data: {
                    beneficiaryId: b.mrn,
                    hospitalId: b.hospitalId,
                    date: randomDate(2024, 2026),
                    sessionNumber: s,
                    Diagnosis: pick(DIAGNOSES),
                    MDVI: pick(MDVI_VALUES),
                    extraInformation: "{}",
                },
            });
        }
    }
    console.log("  ✓ Vision Enhancement records created");

    console.log("Creating Training records...");
    for (const b of createdBeneficiaries) {
        const count = rand(1, 3);
        for (let s = 1; s <= count; s++) {
            const type = pick(TRAINING_TYPES);
            await prisma.training.create({
                data: {
                    beneficiaryId: b.mrn,
                    hospitalId: b.hospitalId,
                    date: randomDate(2024, 2026),
                    sessionNumber: s,
                    type,
                    subType: pick(TRAINING_SUBTYPES[type] || ["Other"]),
                    extraInformation: "{}",
                },
            });
        }
    }
    console.log("  ✓ Training records created");

    console.log("Creating Comprehensive Low Vision Evaluation records...");
    for (const b of createdBeneficiaries) {
        const count = rand(1, 2);
        for (let s = 1; s <= count; s++) {
            await prisma.comprehensive_Low_Vision_Evaluation.create({
                data: {
                    beneficiaryId: b.mrn,
                    hospitalId: b.hospitalId,
                    date: randomDate(2024, 2026),
                    sessionNumber: s,
                    distanceBinocularVisionBE: pick(VA_CATEGORIES),
                    nearBinocularVisionBE: pick(VA_CATEGORIES),
                    distanceVisualAcuityRE: pick(VA_CATEGORIES),
                    distanceVisualAcuityLE: pick(VA_CATEGORIES),
                    nearVisualAcuityRE: pick(VA_CATEGORIES),
                    nearVisualAcuityLE: pick(VA_CATEGORIES),
                    colourVisionRE: pick(["Normal", "Abnormal"]),
                    colourVisionLE: pick(["Normal", "Abnormal"]),
                    diagnosis: pick(DIAGNOSES),
                    mdvi: pick(MDVI_VALUES),
                    recommendationSpectacle: pick(["Yes", "No"]),
                    recommendationOptical: pick(["Yes", "No"]),
                    recommendationElectronic: pick(["Yes", "No"]),
                    recommendationNonOptical: pick(["Yes", "No"]),
                    dispensedSpectacle: pick(["Yes", "No"]),
                    dispensedOptical: pick(["Yes", "No"]),
                    dispensedElectronic: pick(["Yes", "No"]),
                    dispensedNonOptical: pick(["Yes", "No"]),
                    costSpectacle: rand(500, 5000),
                    costOptical: rand(500, 5000),
                    costElectronic: rand(1000, 10000),
                    costToBeneficiarySpectacle: rand(0, 2000),
                    costToBeneficiaryOptical: rand(0, 2000),
                    costToBeneficiaryElectronic: rand(0, 5000),
                    extraInformation: "{}",
                },
            });
        }
    }
    console.log("  ✓ CLVE records created");

    console.log("Creating Counselling Education records...");
    for (const b of createdBeneficiaries) {
        const count = rand(1, 3);
        for (let s = 1; s <= count; s++) {
            await prisma.counselling_Education.create({
                data: {
                    beneficiaryId: b.mrn,
                    hospitalId: b.hospitalId,
                    date: randomDate(2024, 2026),
                    sessionNumber: s,
                    typeCounselling: pick(COUNSELLING_TYPES),
                    MDVI: pick(MDVI_VALUES),
                    vision: pick(VISIONS),
                    type: pick(["Individual", "Group", "Family"]),
                    extraInformation: "{}",
                },
            });
        }
    }
    console.log("  ✓ Counselling Education records created");

    const counts = {
        beneficiaries: await prisma.beneficiary.count(),
        visionEnhancement: await prisma.vision_Enhancement.count(),
        training: await prisma.training.count(),
        clve: await prisma.comprehensive_Low_Vision_Evaluation.count(),
        counselling: await prisma.counselling_Education.count(),
    };

    console.log("\n✅ Done! Database totals:");
    console.table(counts);
}

main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
