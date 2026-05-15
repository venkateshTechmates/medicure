using MedCure.Api.Auth;
using MedCure.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Data;

public static class DbInitializer
{
    public static async Task RunAsync(AppDbContext db, bool autoMigrate = true)
    {
        if (autoMigrate) await db.Database.MigrateAsync();
        if (await db.Tenants.AnyAsync()) return;

        var rng = new Random(42);

        // ── Tenants ───────────────────────────────────────────────
        var mercy    = new Tenant { Name = "Mercy Health",          Location = "Cincinnati, OH",       Tier = "Main",       Initial = "M", ColorHex = "#0e1116" };
        var north    = new Tenant { Name = "Northcare Pediatrics",  Location = "Indianapolis, IN",     Tier = "Consultant", Initial = "N", ColorHex = "#1a8a48" };
        var aurora   = new Tenant { Name = "Aurora Outpatient",     Location = "Columbus, OH",         Tier = "Affiliate",  Initial = "A", ColorHex = "#3a86ff" };
        var riverside= new Tenant { Name = "Riverside Trauma",      Location = "Dayton, OH",           Tier = "Main",       Initial = "R", ColorHex = "#ff4d6b" };
        var stOlives = new Tenant { Name = "St. Olive's",           Location = "Louisville, KY",       Tier = "Affiliate",  Initial = "S", ColorHex = "#ffb84d" };
        db.Tenants.AddRange(mercy, north, aurora, riverside, stOlives);
        await db.SaveChangesAsync();

        // ── Users ─────────────────────────────────────────────────
        var demo = new User
        {
            Email = "demo@medcure.health",
            PasswordHash = PasswordHasher.Hash("demo123!"),
            FullName = "Albert Drobo",
            Title = "MD",
            Specialty = "Internal Medicine",
            Npi = "1234567890",
            LicenseState = "OH",
            Dea = "BD1234567",
            AvatarUrl = "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=120&h=120&fit=crop&crop=faces",
            TwoFactorEnabled = false
        };
        var drPatel = new User
        {
            Email = "patel@medcure.health",
            PasswordHash = PasswordHasher.Hash("demo123!"),
            FullName = "Priya Patel",
            Title = "MD",
            Specialty = "Cardiology",
            Npi = "9876543210",
            LicenseState = "OH",
            Dea = "BP9876543",
            AvatarUrl = "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=120&h=120&fit=crop&crop=faces",
            TwoFactorEnabled = true
        };
        var drChen = new User
        {
            Email = "chen@medcure.health",
            PasswordHash = PasswordHasher.Hash("demo123!"),
            FullName = "Wei Chen",
            Title = "MD",
            Specialty = "Nephrology",
            Npi = "1357924680",
            LicenseState = "IN",
            Dea = "BC1357924",
            AvatarUrl = "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=120&h=120&fit=crop&crop=faces",
            TwoFactorEnabled = false
        };
        var nurseJones = new User
        {
            Email = "jones.rn@medcure.health",
            PasswordHash = PasswordHasher.Hash("demo123!"),
            FullName = "Tamara Jones",
            Title = "RN",
            Specialty = "Critical Care",
            Npi = "2468013579",
            LicenseState = "OH",
            Dea = "",
            AvatarUrl = "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=120&h=120&fit=crop&crop=faces",
            TwoFactorEnabled = false
        };
        db.Users.AddRange(demo, drPatel, drChen, nurseJones);
        await db.SaveChangesAsync();

        db.UserTenants.AddRange(
            new UserTenant { UserId = demo.Id,       TenantId = mercy.Id,     Role = "MD",          PatientsCount = 12, InboxCount = 8,  OnCallHours = 4 },
            new UserTenant { UserId = demo.Id,       TenantId = north.Id,     Role = "Consultant",  PatientsCount = 3,  InboxCount = 2 },
            new UserTenant { UserId = demo.Id,       TenantId = aurora.Id,    Role = "MD",          PatientsCount = 5,  InboxCount = 3,  OnCallHours = 2 },
            new UserTenant { UserId = drPatel.Id,    TenantId = mercy.Id,     Role = "MD",          PatientsCount = 18, InboxCount = 5,  OnCallHours = 8 },
            new UserTenant { UserId = drPatel.Id,    TenantId = riverside.Id, Role = "Consultant",  PatientsCount = 4,  InboxCount = 1 },
            new UserTenant { UserId = drChen.Id,     TenantId = mercy.Id,     Role = "MD",          PatientsCount = 9,  InboxCount = 3,  OnCallHours = 0 },
            new UserTenant { UserId = drChen.Id,     TenantId = stOlives.Id,  Role = "Consultant",  PatientsCount = 2,  InboxCount = 0 },
            new UserTenant { UserId = nurseJones.Id, TenantId = mercy.Id,     Role = "RN",          PatientsCount = 6,  InboxCount = 4,  OnCallHours = 12 }
        );
        await db.SaveChangesAsync();

        // ── Wards & beds (Mercy) ──────────────────────────────────
        var wards = new[] {
            new Ward { TenantId = mercy.Id, Name = "Med-Surg",    Code = "MS",  BedCount = 32, AvgLos = 4.2, NurseRatio = "1:5" },
            new Ward { TenantId = mercy.Id, Name = "ICU",         Code = "ICU", BedCount = 16, AvgLos = 6.1, NurseRatio = "1:2" },
            new Ward { TenantId = mercy.Id, Name = "Telemetry",   Code = "TEL", BedCount = 24, AvgLos = 3.4, NurseRatio = "1:4" },
            new Ward { TenantId = mercy.Id, Name = "Pediatrics",  Code = "PED", BedCount = 18, AvgLos = 2.8, NurseRatio = "1:4" },
            new Ward { TenantId = mercy.Id, Name = "Oncology",    Code = "ONC", BedCount = 20, AvgLos = 7.3, NurseRatio = "1:4" },
            new Ward { TenantId = mercy.Id, Name = "PACU",        Code = "PAC", BedCount = 12, AvgLos = 0.5, NurseRatio = "1:2" },
            new Ward { TenantId = mercy.Id, Name = "Step-Down",   Code = "SDN", BedCount = 22, AvgLos = 2.9, NurseRatio = "1:3" },
        };
        var riversideWards = new[] {
            new Ward { TenantId = riverside.Id, Name = "Trauma Bay",   Code = "TBY", BedCount = 8,  AvgLos = 1.2, NurseRatio = "1:2" },
            new Ward { TenantId = riverside.Id, Name = "Trauma ICU",   Code = "TIC", BedCount = 14, AvgLos = 5.8, NurseRatio = "1:2" },
            new Ward { TenantId = riverside.Id, Name = "Trauma Step",  Code = "TST", BedCount = 18, AvgLos = 3.1, NurseRatio = "1:3" },
        };
        db.Wards.AddRange(wards);
        db.Wards.AddRange(riversideWards);
        await db.SaveChangesAsync();

        foreach (var w in wards.Concat(riversideWards))
            for (int i = 1; i <= w.BedCount; i++)
                db.Beds.Add(new Bed { TenantId = w.TenantId, WardId = w.Id, BedNumber = $"{w.Code}-{i:00}", Status = "empty" });
        await db.SaveChangesAsync();

        // ── Patients ──────────────────────────────────────────────
        var firstNames = new[] { "Albert","Olivia","Liam","Emma","Noah","Ava","Ethan","Sofia","Mason","Isabella","Lucas","Mia","Logan","Charlotte","Elijah","Amelia","James","Harper","Benjamin","Evelyn","Adison","Henry","Abigail","Daniel","Emily","Jackson","Elizabeth","Sebastian","Mila","Aiden","Ella","Matthew","Avery","Samuel","Sofia","David","Camila","Joseph","Aria","Carter","Grace","Zoe","Lily","Chloe","Penelope","Riley","Layla","Nora","Hannah","Scarlett","Violet","Aurora","Hazel","Stella","Paisley","Savannah","Addison","Brooklyn","Ellie","Willow" };
        var lastNames  = new[] { "Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Rodriguez","Martinez","Hernandez","Lopez","Gonzalez","Wilson","Anderson","Thomas","Taylor","Moore","Jackson","Martin","Lee","Perez","Thompson","White","Harris","Sanchez","Clark","Ramirez","Lewis","Robinson","Walker","Young","Allen","King","Wright","Scott","Torres","Nguyen","Hill","Flores" };
        var attendings = new[] { "Dr. Drobo","Dr. Patel","Dr. Chen","Dr. Reyes","Dr. Okafor","Dr. Singh","Dr. Cohen","Dr. Müller","Dr. Kim","Dr. Nakamura","Dr. Osei","Dr. Fernandez" };
        var rns        = new[] { "RN Carter","RN Wilson","RN Lopez","RN Singh","RN Greene","RN Brooks","RN Tamara Jones","RN Park","RN Nguyen","RN Torres" };
        var statuses   = new[] { "good","good","good","good","warn","warn","bad" };

        var patients = new List<Patient>();
        for (int i = 0; i < 120; i++)
        {
            var w = wards[rng.Next(wards.Length)];
            var p = new Patient
            {
                TenantId = mercy.Id,
                Mrn = $"MR{100000 + i:000000}",
                FirstName = firstNames[rng.Next(firstNames.Length)],
                LastName  = lastNames[rng.Next(lastNames.Length)],
                DateOfBirth = DateTime.UtcNow.AddYears(-rng.Next(2, 92)).AddDays(-rng.Next(0, 365)),
                Sex = rng.Next(2) == 0 ? "M" : "F",
                WeightKg = Math.Round(50 + rng.NextDouble() * 50, 1),
                HeightCm = 150 + rng.Next(50),
                CodeStatus = rng.Next(10) < 8 ? "Full Code" : "DNR",
                Insurance = new[]{"Aetna","BCBS","UHC","Medicare","Medicaid","Self-pay"}[rng.Next(6)],
                Phone = $"+1 (513) {rng.Next(200,999)}-{rng.Next(1000,9999)}",
                Address = $"{rng.Next(100,9999)} Elm St, Cincinnati OH",
                Status = statuses[rng.Next(statuses.Length)],
                Ward = w.Name,
                Bed = $"{w.Code}-{rng.Next(1, w.BedCount + 1):00}",
                AttendingName = attendings[rng.Next(attendings.Length)],
                PrimaryRn = rns[rng.Next(rns.Length)],
                AdmittedAt = DateTime.UtcNow.AddDays(-rng.Next(0, 14)).AddHours(-rng.Next(0, 24)),
                AvatarUrl = $"https://i.pravatar.cc/120?img={i + 1}"
            };
            patients.Add(p);
        }
        db.Patients.AddRange(patients);
        await db.SaveChangesAsync();

        // ── Assign beds to patients ───────────────────────────────
        var allBeds = await db.Beds.Where(b => b.TenantId == mercy.Id).ToListAsync();
        var bedStatuses = new[] { "occ","occ","occ","occ","empty","empty","cleaning","held","discharge","iso","boarding" };
        foreach (var bed in allBeds)
        {
            bed.Status = bedStatuses[rng.Next(bedStatuses.Length)];
            if (bed.Status == "occ" || bed.Status == "iso" || bed.Status == "boarding")
            {
                var p = patients[rng.Next(patients.Count)];
                bed.PatientId = p.Id;
            }
        }
        await db.SaveChangesAsync();

        // ── Encounters ────────────────────────────────────────────
        var encounterTypes = new[] { "Inpatient","Inpatient","Inpatient","ED","Clinic","OR" };
        var dispositions   = new[] { "","Admit","Discharge","Observe","Transfer","ICU upgrade" };
        var encounterCcs = new[] { "Chest pain","SOB","Abdominal pain","Headache","Fall","Lac to scalp","Fever","RLQ pain","Back pain","Sepsis r/o","AMS","Syncope","Palpitations","Edema","Hemoptysis","Nausea/vomiting","Dysuria","Hip pain","Shoulder pain","Weakness" };
        var encounters = new List<Encounter>();
        foreach (var p in patients)
        {
            int eCount = rng.Next(1, 4);
            for (int e = 0; e < eCount; e++)
            {
                var type = encounterTypes[rng.Next(encounterTypes.Length)];
                var start = DateTime.UtcNow.AddDays(-rng.Next(0, 180));
                var ended = e < eCount - 1; // most encounters are closed except the latest
                encounters.Add(new Encounter
                {
                    TenantId = mercy.Id,
                    PatientId = p.Id,
                    Type = type,
                    StartAt = start,
                    EndAt = ended ? start.AddDays(rng.Next(1, 12)) : null,
                    ChiefComplaint = encounterCcs[rng.Next(encounterCcs.Length)],
                    EsiLevel = type == "ED" ? rng.Next(1, 6) : null,
                    Disposition = ended ? dispositions[rng.Next(dispositions.Length)] : ""
                });
            }
        }
        db.Encounters.AddRange(encounters);
        await db.SaveChangesAsync();

        // ── Allergies + Problems + Vitals ────────────────────────
        var allergens = new[] { ("Penicillin","hives","moderate"), ("Sulfa","rash","mild"), ("Latex","contact dermatitis","mild"), ("Peanut","anaphylaxis","severe"), ("Iodine contrast","urticaria","moderate"), ("Codeine","nausea","mild"), ("Aspirin","bronchospasm","severe"), ("NSAIDs","GI bleeding","moderate"), ("Cephalosporin","rash","mild"), ("Morphine","pruritus","mild") };
        var problems  = new[] { ("Type 2 Diabetes","E11.9"), ("Essential Hypertension","I10"), ("Coronary Artery Disease","I25.10"), ("CKD Stage 3","N18.30"), ("COPD","J44.9"), ("Atrial Fibrillation","I48.91"), ("Pneumonia","J18.9"), ("Sepsis","A41.9"), ("Heart Failure","I50.9"), ("Acute MI","I21.9"), ("Stroke","I63.9"), ("DVT","I82.401"), ("PE","I26.09"), ("AKI","N17.9"), ("UTI","N39.0"), ("Cellulitis","L03.90"), ("GERD","K21.0"), ("Hypothyroidism","E03.9"), ("Anemia","D64.9"), ("Cirrhosis","K74.60") };
        foreach (var p in patients)
        {
            int aCount = rng.Next(0, 3);
            for (int i = 0; i < aCount; i++)
            {
                var a = allergens[rng.Next(allergens.Length)];
                db.Allergies.Add(new Allergy { TenantId = mercy.Id, PatientId = p.Id, Substance = a.Item1, Reaction = a.Item2, Severity = a.Item3 });
            }
            int pCount = rng.Next(1, 4);
            for (int i = 0; i < pCount; i++)
            {
                var pr = problems[rng.Next(problems.Length)];
                db.Problems.Add(new Problem { TenantId = mercy.Id, PatientId = p.Id, Description = pr.Item1, IcdCode = pr.Item2, Onset = DateTime.UtcNow.AddYears(-rng.Next(0,15)), Type = "active" });
            }
            var vaccines = new[] { ("Influenza","Sanofi","Fluzone","L deltoid","2025","Annual"), ("COVID-19","Pfizer","BNT162b2","R deltoid","BNT-XK422","Booster"), ("Tdap","GSK","Boostrix","L deltoid","TD-991","Once"), ("Pneumococcal","Pfizer","Prevnar 20","R deltoid","PV-401","1 of 1") };
            int iCount = rng.Next(1, 4);
            for (int i = 0; i < iCount; i++)
            {
                var v = vaccines[rng.Next(vaccines.Length)];
                db.Immunizations.Add(new Immunization {
                    TenantId = mercy.Id, PatientId = p.Id,
                    Vaccine = v.Item1, Manufacturer = v.Item2, LotNumber = v.Item5,
                    Site = v.Item4, Route = "IM", DoseSeries = v.Item6,
                    Administered = DateTime.UtcNow.AddDays(-rng.Next(1, 365)),
                    AdministeredBy = "RN J. Park", Status = "completed"
                });
            }
            for (int i = 0; i < 8; i++)
            {
                db.Vitals.Add(new Vital
                {
                    TenantId = mercy.Id,
                    PatientId = p.Id,
                    RecordedAt = DateTime.UtcNow.AddHours(-i * 4),
                    Hr = 60 + rng.Next(40),
                    Sbp = 100 + rng.Next(50),
                    Dbp = 60 + rng.Next(30),
                    Spo2 = 92 + rng.Next(8),
                    Rr = 12 + rng.Next(10),
                    TempC = Math.Round(36 + rng.NextDouble() * 2, 1),
                    Pain = rng.Next(11),
                    RecordedBy = rns[rng.Next(rns.Length)]
                });
            }
        }
        await db.SaveChangesAsync();

        // ── Appointments (today + next 7 days) ────────────────────
        var apptTypes = new[] { "Follow-up","New patient","Procedure","Telehealth","Pre-op" };
        for (int d = 0; d < 7; d++)
        {
            for (int s = 0; s < 12; s++)
            {
                var pat = patients[rng.Next(patients.Count)];
                var t = DateTime.UtcNow.Date.AddDays(d).AddHours(8).AddMinutes(s * 30);
                db.Appointments.Add(new Appointment
                {
                    TenantId = mercy.Id, PatientId = pat.Id,
                    ProviderName = attendings[rng.Next(attendings.Length)],
                    Specialty = "Internal Medicine",
                    Room = $"R-{rng.Next(100, 400)}",
                    ScheduledAt = t,
                    DurationMin = 30,
                    Type = apptTypes[rng.Next(apptTypes.Length)],
                    Status = d == 0 && s < 4 ? "checked-in" : "scheduled"
                });
            }
        }
        await db.SaveChangesAsync();

        // ── Orders ────────────────────────────────────────────────
        var meds = new[] {
            ("Lisinopril","10 mg","PO","daily"),
            ("Metformin","500 mg","PO","BID"),
            ("Atorvastatin","40 mg","PO","HS"),
            ("Aspirin","81 mg","PO","daily"),
            ("Heparin","5000 U","SC","q8h"),
            ("Vancomycin","1 g","IV","q12h"),
            ("Furosemide","20 mg","IV","BID"),
            ("Pantoprazole","40 mg","IV","daily"),
            ("Insulin (Aspart)","sliding scale","SC","ACHS"),
            ("Acetaminophen","650 mg","PO","q6h PRN")
        };
        var orderStatuses = new[] { "draft","signed","verified","verified","verified","administered" };
        var prios = new[] { "Routine","Routine","Routine","Urgent","Stat" };
        for (int i = 0; i < 220; i++)
        {
            var pat = patients[rng.Next(patients.Count)];
            var m = meds[rng.Next(meds.Length)];
            db.Orders.Add(new Order
            {
                TenantId = mercy.Id, PatientId = pat.Id,
                OrderType = "Medication",
                Name = m.Item1, Dose = m.Item2, Route = m.Item3, Frequency = m.Item4,
                Indication = problems[rng.Next(problems.Length)].Item1,
                Priority = prios[rng.Next(prios.Length)],
                Status = orderStatuses[rng.Next(orderStatuses.Length)],
                OrderedByName = attendings[rng.Next(attendings.Length)],
                SignedAt = DateTime.UtcNow.AddHours(-rng.Next(1, 72)),
                StartAt = DateTime.UtcNow.AddHours(-rng.Next(0, 48)),
                Duration = $"{rng.Next(1, 14)}d"
            });
        }

        // ── Imaging orders ────────────────────────────────────────
        var imagingStudies = new[] {
            "CT Chest w/ Contrast", "CT Abdomen/Pelvis", "CT Head w/o Contrast",
            "MRI Brain", "MRI L-Spine", "CXR PA/Lat", "CTA Chest (PE protocol)",
            "ECHO TTE", "Pelvic Ultrasound", "Mammogram bilateral"
        };
        var imagingIndications = new[] {
            "SOB, hypoxia", "Abdominal pain", "Headache, AMS",
            "Stroke r/o", "Lower back pain", "Cough, fever",
            "PE r/o", "EF assessment", "Pelvic pain", "Annual screening"
        };
        var imagingStatuses = new[] { "signed","signed","verified","completed" };
        for (int i = 0; i < 28; i++)
        {
            var pat = patients[rng.Next(patients.Count)];
            var idx = rng.Next(imagingStudies.Length);
            db.Orders.Add(new Order
            {
                TenantId = mercy.Id, PatientId = pat.Id,
                OrderType = "Imaging",
                Name = imagingStudies[idx],
                Indication = imagingIndications[idx],
                Route = "—", Dose = "—", Frequency = "—",
                Priority = prios[rng.Next(prios.Length)],
                Status = imagingStatuses[rng.Next(imagingStatuses.Length)],
                OrderedByName = attendings[rng.Next(attendings.Length)],
                SignedAt = DateTime.UtcNow.AddHours(-rng.Next(1, 48))
            });
        }
        await db.SaveChangesAsync();

        // ── Specimens (pathology + lab) ───────────────────────────
        var specTypes = new[] {
            "Gallbladder", "Lung biopsy", "Skin punch", "Endometrial biopsy",
            "Mediastinal LN", "Coronary plaque", "Bone marrow", "Liver biopsy",
            "Blood culture", "Urine culture", "Sputum", "Wound culture"
        };
        var specStatuses = new[] { "Pending", "Pending", "In transit", "In lab", "On scope", "Reported", "Final" };
        var specLocations = new[] { "OR-1", "OR-2", "ED", "Outpt clinic", "ICU", "IR-suite", "Cath lab" };
        for (int i = 0; i < 24; i++)
        {
            var pat = patients[rng.Next(patients.Count)];
            db.Specimens.Add(new Specimen
            {
                TenantId = mercy.Id, PatientId = pat.Id,
                Type = specTypes[rng.Next(specTypes.Length)],
                Status = specStatuses[rng.Next(specStatuses.Length)],
                CollectedAt = DateTime.UtcNow.AddHours(-rng.Next(1, 96)),
                CollectedBy = attendings[rng.Next(attendings.Length)],
                Location = specLocations[rng.Next(specLocations.Length)],
                Priority = prios[rng.Next(prios.Length)]
            });
        }
        await db.SaveChangesAsync();

        // ── Lab results ───────────────────────────────────────────
        var labs = new (string Panel, string Test, string Units, string Range, double Lo, double Hi)[] {
            ("CBC","WBC","K/uL","4.0–11.0", 4.0, 11.0),
            ("CBC","Hgb","g/dL","13.5–17.5", 13.5, 17.5),
            ("CBC","Plt","K/uL","150–450", 150, 450),
            ("BMP","Na","mmol/L","135–145", 135, 145),
            ("BMP","K","mmol/L","3.5–5.0", 3.5, 5.0),
            ("BMP","Cr","mg/dL","0.7–1.3", 0.7, 1.3),
            ("BMP","Glucose","mg/dL","70–110", 70, 110),
            ("LFT","ALT","U/L","7–55", 7, 55),
            ("LFT","AST","U/L","8–48", 8, 48),
            ("Coag","INR","","0.8–1.2", 0.8, 1.2),
        };
        for (int i = 0; i < 480; i++)
        {
            var pat = patients[rng.Next(patients.Count)];
            var t = labs[rng.Next(labs.Length)];
            var raw = t.Lo + rng.NextDouble() * (t.Hi - t.Lo) * 1.4 - (t.Hi - t.Lo) * 0.2;
            string flag = raw < t.Lo ? "low" : raw > t.Hi ? "high" : "normal";
            if (rng.Next(40) == 0) flag = "critical";
            db.LabResults.Add(new LabResult
            {
                TenantId = mercy.Id, PatientId = pat.Id, Panel = t.Panel, TestName = t.Test,
                Value = raw.ToString("F1"), Units = t.Units, RefRange = t.Range, Flag = flag,
                ResultedAt = DateTime.UtcNow.AddHours(-rng.Next(0, 72)),
                ResultedBy = "Lab Tech"
            });
        }
        await db.SaveChangesAsync();

        // ── Inventory ─────────────────────────────────────────────
        foreach (var (i, m) in meds.Select((m,i)=>(i,m)))
        {
            db.InventoryItems.Add(new InventoryItem
            {
                TenantId = mercy.Id,
                Name = m.Item1, Ndc = $"00000-{i:0000}-01", Sku = $"SKU{i:000}",
                Category = "Medication",
                OnHand = rng.Next(5, 200), ParLevel = 60,
                Location = new[]{"Pharmacy A","Pharmacy B","Pyxis-3W","Pyxis-ICU"}[rng.Next(4)],
                LotNumber = $"L{rng.Next(10000, 99999)}",
                ExpiresAt = DateTime.UtcNow.AddDays(rng.Next(15, 720)),
                UnitCost = (decimal)Math.Round(rng.NextDouble() * 25, 2)
            });
        }
        await db.SaveChangesAsync();

        // ── ED arrivals ───────────────────────────────────────────
        var ccs = new[] { "Chest pain","SOB","Abdominal pain","Headache","Fall","Lac to scalp","Fever","RLQ pain","Back pain","Sepsis r/o" };
        for (int i = 0; i < 18; i++)
        {
            db.EDArrivals.Add(new EDArrival
            {
                TenantId = mercy.Id,
                PatientName = $"{firstNames[rng.Next(firstNames.Length)]} {lastNames[rng.Next(lastNames.Length)]}",
                Age = rng.Next(2, 92), Sex = rng.Next(2)==0?"M":"F",
                ChiefComplaint = ccs[rng.Next(ccs.Length)],
                EsiLevel = rng.Next(1, 6),
                ArrivalMode = new[]{"Walk-in","EMS","POV"}[rng.Next(3)],
                ArrivedAt = DateTime.UtcNow.AddMinutes(-rng.Next(0, 240)),
                Status = new[]{"triaged","in-bed","dispo","triaged"}[rng.Next(4)],
                Bay = rng.Next(2)==0 ? $"ED-{rng.Next(1,32)}" : "",
                Hr = 60+rng.Next(60), Sbp = 90+rng.Next(70), Spo2 = 88+rng.Next(12)
            });
        }
        await db.SaveChangesAsync();

        // ── Claims ────────────────────────────────────────────────
        var payers = new[] { "Aetna","BCBS","UHC","Medicare","Medicaid","Cigna" };
        var cstats = new[] { "submitted","paid","paid","denied","appealing","submitted" };
        for (int i = 0; i < 60; i++)
        {
            var pat = patients[rng.Next(patients.Count)];
            db.Claims.Add(new Claim
            {
                TenantId = mercy.Id, PatientId = pat.Id,
                ClaimNumber = $"CLM{rng.Next(100000, 999999)}",
                Payer = payers[rng.Next(payers.Length)],
                CptCode = $"99{rng.Next(200, 299)}",
                ServiceDescription = "Hospital E&M",
                DateOfService = DateTime.UtcNow.AddDays(-rng.Next(0, 120)),
                Amount = (decimal)Math.Round(200 + rng.NextDouble() * 4800, 2),
                Status = cstats[rng.Next(cstats.Length)],
                DenialReason = rng.Next(6)==0 ? "CO-50 — Not deemed medically necessary" : ""
            });
        }
        await db.SaveChangesAsync();

        // ── Documents, Notes, Messages ────────────────────────────
        for (int i = 0; i < 30; i++)
        {
            var pat = patients[rng.Next(patients.Count)];
            db.Documents.Add(new Document
            {
                TenantId = mercy.Id, PatientId = pat.Id,
                Title = new[]{"Consent Form","H&P","Discharge Summary","Imaging Report","Op Note"}[rng.Next(5)],
                Category = new[]{"Consent","Note","Imaging","Lab"}[rng.Next(4)],
                FileType = "pdf", Pages = rng.Next(1,12), SizeBytes = rng.Next(50_000, 2_000_000),
                AuthorName = attendings[rng.Next(attendings.Length)],
                Status = new[]{"signed","draft","unsigned"}[rng.Next(3)]
            });
        }
        for (int i = 0; i < 60; i++)
        {
            var pat = patients[rng.Next(patients.Count)];
            db.Notes.Add(new Note
            {
                TenantId = mercy.Id, PatientId = pat.Id,
                Type = new[]{"Progress","Nursing","Consult","H&P"}[rng.Next(4)],
                AuthorName = attendings[rng.Next(attendings.Length)],
                Content = "Patient stable. Continue current regimen. Reviewed labs and imaging.",
                Signed = rng.Next(4) > 0,
                SignedAt = DateTime.UtcNow.AddHours(-rng.Next(0, 240))
            });
        }
        for (int i = 0; i < 12; i++)
        {
            var t = new MessageThread
            {
                TenantId = mercy.Id,
                Subject = new[]{"Urgent consult","Patient update","Coverage question","Lab follow-up","Discharge plan"}[rng.Next(5)],
                Urgent = rng.Next(4) == 0,
                LastMessageAt = DateTime.UtcNow.AddMinutes(-rng.Next(0, 1440)),
                Participants = $"Albert Drobo, {attendings[rng.Next(attendings.Length)]}"
            };
            db.MessageThreads.Add(t);
            await db.SaveChangesAsync();
            for (int j = 0; j < rng.Next(2, 6); j++)
            {
                db.Messages.Add(new Message
                {
                    TenantId = mercy.Id, ThreadId = t.Id,
                    SenderName = j%2==0 ? "Albert Drobo" : attendings[rng.Next(attendings.Length)],
                    Body = "Following up on the patient — please advise.",
                    SentAt = DateTime.UtcNow.AddMinutes(-rng.Next(0, 1440)),
                    Read = j < 2
                });
            }
        }
        await db.SaveChangesAsync();

        // ── Consults ──────────────────────────────────────────────
        var fromSvc = new[] { "Hospitalist","ED","Surgery","ICU","Med-Surg" };
        var toSvc   = new[] { "Cardiology","Nephrology","Pulmonology","Neurology","Endocrinology","Infectious Disease" };
        var consultReasons = new[] { "Rate-control management","Acute kidney injury workup","Hypoxic respiratory failure","Stroke evaluation","Glycemic control","Bacteremia source identification" };
        for (int i = 0; i < 18; i++)
        {
            var pat = patients[rng.Next(patients.Count)];
            var status = new[] { "Pending","Pending","Accepted","Completed" }[rng.Next(4)];
            db.ConsultRequests.Add(new ConsultRequest
            {
                TenantId = mercy.Id, PatientId = pat.Id,
                FromService = fromSvc[rng.Next(fromSvc.Length)],
                ToService = toSvc[rng.Next(toSvc.Length)],
                ToProvider = attendings[rng.Next(attendings.Length)],
                Reason = consultReasons[rng.Next(consultReasons.Length)],
                Question = "Recommend management strategy and follow-up plan.",
                Urgency = new[] { "Stat","Urgent","Routine","Routine" }[rng.Next(4)],
                Status = status,
                Response = status == "Completed" ? "Recommend continuing current therapy with close follow-up in 2-3 days." : "",
                RequestedAt = DateTime.UtcNow.AddHours(-rng.Next(0, 72)),
                RespondedAt = status == "Completed" ? DateTime.UtcNow.AddHours(-rng.Next(0, 24)) : null,
                RequestedByName = attendings[rng.Next(attendings.Length)],
                RespondedByName = status == "Completed" ? attendings[rng.Next(attendings.Length)] : ""
            });
        }

        // ── Transfers ─────────────────────────────────────────────
        var units = new[] { "ED","ICU","CCU","Med-Surg","Telemetry","PACU","Step-down" };
        for (int i = 0; i < 14; i++)
        {
            var pat = patients[rng.Next(patients.Count)];
            var status = new[] { "Pending","Pending","Accepted","InTransit","Completed" }[rng.Next(5)];
            db.TransferRequests.Add(new TransferRequest
            {
                TenantId = mercy.Id, PatientId = pat.Id,
                FromUnit = units[rng.Next(units.Length)],
                ToUnit = units[rng.Next(units.Length)],
                Reason = new[] { "Higher level of care","Down-grade — clinically stable","Specialty service","Bed availability" }[rng.Next(4)],
                Acuity = new[] { "Stable","Watcher","Critical" }[rng.Next(3)],
                Isolation = new[] { "None","None","Contact","Droplet" }[rng.Next(4)],
                Status = status,
                AcceptedBy = status == "Accepted" || status == "InTransit" || status == "Completed" ? attendings[rng.Next(attendings.Length)] : "",
                RequestedAt = DateTime.UtcNow.AddHours(-rng.Next(0, 48)),
                AcceptedAt = status != "Pending" ? DateTime.UtcNow.AddHours(-rng.Next(0, 24)) : null,
                CompletedAt = status == "Completed" ? DateTime.UtcNow.AddHours(-rng.Next(0, 6)) : null,
                RequestedByName = attendings[rng.Next(attendings.Length)],
                Notes = "Bedside report given · MRSA precautions noted"
            });
        }
        // ── Lab & Nursing orders ──────────────────────────────────
        var labPanels = new[] {
            ("CBC","Complete Blood Count"), ("BMP","Basic Metabolic Panel"), ("CMP","Comprehensive Metabolic"),
            ("LFT","Liver Function Tests"), ("Coag","Coagulation Panel"), ("ABG","Arterial Blood Gas"),
            ("UA","Urinalysis"), ("Blood Cx","Blood Culture x2"), ("Urine Cx","Urine Culture"),
            ("Troponin","High-sens Troponin I"), ("BNP","Brain Natriuretic Peptide"), ("HbA1c","Hemoglobin A1c"),
            ("Lipids","Lipid Panel"), ("TSH","Thyroid Stimulating Hormone")
        };
        for (int i = 0; i < 110; i++)
        {
            var pat = patients[rng.Next(patients.Count)];
            var lab = labPanels[rng.Next(labPanels.Length)];
            db.Orders.Add(new Order
            {
                TenantId = mercy.Id, PatientId = pat.Id,
                OrderType = "Lab",
                Name = lab.Item2, Dose = "—", Route = "—", Frequency = "—",
                Indication = problems[rng.Next(problems.Length)].Item1,
                Priority = prios[rng.Next(prios.Length)],
                Status = orderStatuses[rng.Next(orderStatuses.Length)],
                OrderedByName = attendings[rng.Next(attendings.Length)],
                SignedAt = DateTime.UtcNow.AddHours(-rng.Next(1, 72))
            });
        }

        var nursingOrders = new[] {
            "Vital signs q4h", "Daily weight", "I&O strict", "Fall precautions", "Aspiration precautions",
            "Continuous pulse oximetry", "Telemetry monitoring", "Foley catheter care", "Wound care daily",
            "Turn q2h", "DVT prophylaxis", "Neuro checks q2h", "Blood glucose ACHS", "O2 titrate to SpO2 ≥94%"
        };
        for (int i = 0; i < 80; i++)
        {
            var pat = patients[rng.Next(patients.Count)];
            db.Orders.Add(new Order
            {
                TenantId = mercy.Id, PatientId = pat.Id,
                OrderType = "Nursing",
                Name = nursingOrders[rng.Next(nursingOrders.Length)],
                Dose = "—", Route = "—", Frequency = "Ongoing",
                Indication = "",
                Priority = "Routine",
                Status = new[] { "signed","verified","verified" }[rng.Next(3)],
                OrderedByName = attendings[rng.Next(attendings.Length)],
                SignedAt = DateTime.UtcNow.AddHours(-rng.Next(1, 96))
            });
        }

        var dietOrders = new[] {
            "Regular diet", "Cardiac diet (low sodium)", "Diabetic diet", "NPO after midnight",
            "Clear liquids", "Low-fat diet", "Renal diet", "High-protein supplements BID"
        };
        for (int i = 0; i < 50; i++)
        {
            var pat = patients[rng.Next(patients.Count)];
            db.Orders.Add(new Order
            {
                TenantId = mercy.Id, PatientId = pat.Id,
                OrderType = "Diet",
                Name = dietOrders[rng.Next(dietOrders.Length)],
                Dose = "—", Route = "Oral", Frequency = "Daily",
                Indication = "",
                Priority = "Routine",
                Status = "verified",
                OrderedByName = attendings[rng.Next(attendings.Length)],
                SignedAt = DateTime.UtcNow.AddHours(-rng.Next(1, 72))
            });
        }
        await db.SaveChangesAsync();

        // ── Medication Administrations (eMAR) ─────────────────────
        var savedMedOrders = await db.Orders
            .Where(o => o.TenantId == mercy.Id && o.OrderType == "Medication" && o.Status != "draft")
            .ToListAsync();
        var marStatuses = new[] { "given","given","given","given","late","held","refused","scheduled" };
        foreach (var order in savedMedOrders)
        {
            // seed ~3 administrations per active medication order
            for (int a = 0; a < rng.Next(1, 5); a++)
            {
                var scheduled = DateTime.UtcNow.AddHours(-a * 8 - rng.Next(0, 4));
                var status = marStatuses[rng.Next(marStatuses.Length)];
                db.MedAdmins.Add(new MedicationAdministration
                {
                    TenantId = mercy.Id,
                    OrderId = order.Id,
                    PatientId = order.PatientId,
                    ScheduledAt = scheduled,
                    AdministeredAt = status == "given" ? scheduled.AddMinutes(rng.Next(-15, 30)) : null,
                    Status = status,
                    AdministeredBy = rns[rng.Next(rns.Length)],
                    ScanVerified = status == "given" && rng.Next(3) > 0,
                    Notes = status == "held" ? "Patient refused oral medications" : status == "refused" ? "Patient declined — counseled" : ""
                });
            }
        }
        await db.SaveChangesAsync();

        // ── CDS Alerts ────────────────────────────────────────────
        var cdsMessages = new (string Type, string Sev, string Msg, string Rec)[] {
            ("Drug-Allergy",     "crit", "Penicillin allergy on file — Amoxicillin ordered",                                    "Substitute with azithromycin or doxycycline"),
            ("Drug-Interaction", "warn", "Warfarin + Metronidazole: significant CYP2C9 inhibition",                             "Monitor INR closely; consider dose reduction"),
            ("Drug-Interaction", "warn", "Heparin + Aspirin: additive bleeding risk",                                           "Ensure indication justifies concurrent use"),
            ("Duplicate Order",  "info", "Acetaminophen 650 mg q6h already active — new PRN order duplicates",                  "Cancel one of the duplicate orders"),
            ("Renal Dose",       "warn", "Vancomycin: patient CrCl 28 mL/min — dose requires adjustment",                      "Pharmacy consult recommended; target AUC 400–600"),
            ("High Alert",       "crit", "Insulin ordered without meal tray confirmed",                                         "Verify patient is able to eat before administration"),
            ("Drug-Allergy",     "crit", "Sulfa allergy on file — Trimethoprim/Sulfamethoxazole ordered",                       "Select an alternative antibiotic"),
            ("Contraindication", "warn", "Metformin: eGFR < 30 — contraindicated",                                              "Discontinue metformin; consider insulin or GLP-1 agonist"),
            ("Drug-Interaction", "info", "Lisinopril + Spironolactone: risk of hyperkalemia",                                   "Monitor potassium; check renal function within 5–7 days"),
            ("Dose Check",       "warn", "Furosemide 160 mg IV exceeds typical maximum single dose (80–120 mg)",                "Verify intent; split into two doses if appropriate"),
            ("Therapeutic Dup",  "info", "Two beta-blockers active: Metoprolol succinate + Carvedilol",                         "Confirm intended; taper one agent before starting the other"),
            ("Lab Alert",        "crit", "Potassium 6.2 mEq/L — critical hyperkalemia, order signed before result reviewed",    "Assess ECG; initiate treatment per hyperkalemia protocol"),
        };

        var cdsOrders = await db.Orders.Where(o => o.TenantId == mercy.Id).ToListAsync();
        for (int i = 0; i < 48; i++)
        {
            var alert = cdsMessages[rng.Next(cdsMessages.Length)];
            var order = cdsOrders[rng.Next(cdsOrders.Count)];
            db.CdsAlerts.Add(new CdsAlert
            {
                TenantId = mercy.Id,
                OrderId = order.Id,
                Type = alert.Type,
                Severity = alert.Sev,
                Message = alert.Msg,
                Recommendation = alert.Rec
            });
        }
        await db.SaveChangesAsync();

        // ── Code Events ───────────────────────────────────────────
        var codeKinds    = new[] { "Blue","Blue","STEMI","Stroke","Trauma","Sepsis","MTP" };
        var codeLocations= new[] { "ED Bay 4","ICU-2","Med-Surg 3W","Telemetry 2E","OR-3","Cath Lab","ED Trauma Bay","PACU" };
        var codeOutcomes = new[] { "ROSC","ROSC","transferred","deceased","false alarm","transferred","ROSC" };
        var timelineTemplates = new Dictionary<string, string>
        {
            ["Blue"]   = """[{"at":0,"label":"Code called","done":true},{"at":1,"label":"Team assembled","done":true},{"at":2,"label":"CPR initiated","done":true},{"at":10,"label":"Epinephrine 1 mg IV","done":true},{"at":12,"label":"Defibrillation 200 J","done":true},{"at":20,"label":"ROSC achieved","done":false}]""",
            ["STEMI"]  = """[{"at":0,"label":"ECG acquired","done":true},{"at":5,"label":"Cath lab activated","done":true},{"at":12,"label":"Aspirin 325 mg given","done":true},{"at":20,"label":"Heparin bolus","done":true},{"at":45,"label":"PCI — door to balloon","done":false}]""",
            ["Stroke"]  = """[{"at":0,"label":"Stroke team paged","done":true},{"at":5,"label":"CT head ordered","done":true},{"at":15,"label":"NIH Stroke Scale completed","done":true},{"at":30,"label":"tPA eligibility reviewed","done":false}]""",
            ["Sepsis"]  = """[{"at":0,"label":"Sepsis alert triggered","done":true},{"at":5,"label":"Blood cultures x2 drawn","done":true},{"at":10,"label":"Broad-spectrum antibiotics","done":true},{"at":20,"label":"30 mL/kg IVF bolus started","done":false}]""",
            ["Trauma"]  = """[{"at":0,"label":"Trauma activation","done":true},{"at":3,"label":"Primary survey","done":true},{"at":8,"label":"Secondary survey","done":true},{"at":15,"label":"CT trauma survey","done":false}]""",
            ["MTP"]     = """[{"at":0,"label":"MTP activated","done":true},{"at":5,"label":"O-neg RBCs released","done":true},{"at":10,"label":"1:1:1 ratio started","done":false}]""",
        };
        for (int i = 0; i < 12; i++)
        {
            var kind     = codeKinds[rng.Next(codeKinds.Length)];
            var pat      = rng.Next(4) > 0 ? patients[rng.Next(patients.Count)] : null;
            var active   = rng.Next(4) == 0;
            var activated = DateTime.UtcNow.AddMinutes(-rng.Next(0, 480));
            db.CodeEvents.Add(new CodeEvent
            {
                TenantId = mercy.Id,
                PatientId = pat?.Id,
                Kind = kind,
                Location = codeLocations[rng.Next(codeLocations.Length)],
                ActivatedBy = attendings[rng.Next(attendings.Length)],
                ActivatedAt = activated,
                ResolvedAt = active ? null : activated.AddMinutes(rng.Next(10, 90)),
                Outcome = active ? "" : codeOutcomes[rng.Next(codeOutcomes.Length)],
                Status = active ? "active" : "resolved",
                TimelineJson = timelineTemplates.TryGetValue(kind, out var tl) ? tl : "[]"
            });
        }
        await db.SaveChangesAsync();

        // ── More Documents ────────────────────────────────────────
        var extraDocTitles = new[] {
            "Advance Directive","Insurance Card (front)","Insurance Card (back)",
            "Pathology Report","Cardiology Consult Note","Nephrology Consult Note",
            "Physical Therapy Eval","Social Work Assessment","Nutrition Assessment",
            "Pre-op Checklist","Post-op Note","Anesthesia Record",
            "Radiology Report — CXR","Radiology Report — CT Chest","Echo Report",
            "EKG Tracing","Transfer Summary","Referral Letter"
        };
        for (int i = 0; i < 60; i++)
        {
            var pat = patients[rng.Next(patients.Count)];
            db.Documents.Add(new Document
            {
                TenantId = mercy.Id, PatientId = pat.Id,
                Title = extraDocTitles[rng.Next(extraDocTitles.Length)],
                Category = new[]{"Consent","Note","Imaging","Lab","Administrative","Referral"}[rng.Next(6)],
                FileType = rng.Next(4) == 0 ? "jpg" : "pdf",
                Pages = rng.Next(1, 20), SizeBytes = rng.Next(50_000, 5_000_000),
                AuthorName = attendings[rng.Next(attendings.Length)],
                Status = new[]{"signed","signed","draft","unsigned"}[rng.Next(4)]
            });
        }
        await db.SaveChangesAsync();

        // ── More Notes ────────────────────────────────────────────
        var noteContents = new[] {
            "Patient continues to improve clinically. Afebrile overnight. Tolerating diet. Continue current management.",
            "Vitals stable. WBC trending down. Blood cultures no growth at 48h. ID following.",
            "Family meeting held. Goals of care discussed. Patient wishes to continue full treatment.",
            "Respiratory status improved on 2L NC. O2 weaned from 4L. Ambulating with PT.",
            "BUN/Cr stable. Urine output adequate. Nephrology recommends continuing current fluid strategy.",
            "Cardiology consult completed. Recommend rate control with metoprolol. Echo ordered.",
            "Patient reports pain 3/10. Analgesics effective. No new complaints.",
            "Social work consulted for discharge planning. Patient may need short-term rehab.",
            "Hyperglycemia persisting. Endocrine consulted. Insulin regimen to be adjusted.",
            "CT results reviewed — no acute finding. Continue observation.",
            "Patient expressing anxiety about diagnosis. Chaplaincy and social work notified.",
            "PICC line placed without complication. CXR confirming tip position.",
        };
        for (int i = 0; i < 80; i++)
        {
            var pat = patients[rng.Next(patients.Count)];
            db.Notes.Add(new Note
            {
                TenantId = mercy.Id, PatientId = pat.Id,
                Type = new[]{"Progress","Nursing","Consult","H&P","Procedure","Discharge"}[rng.Next(6)],
                AuthorName = rng.Next(3) == 0 ? rns[rng.Next(rns.Length)] : attendings[rng.Next(attendings.Length)],
                Content = noteContents[rng.Next(noteContents.Length)],
                Signed = rng.Next(4) > 0,
                SignedAt = DateTime.UtcNow.AddHours(-rng.Next(0, 240))
            });
        }
        await db.SaveChangesAsync();

        // ── More Message Threads ──────────────────────────────────
        var threadSubjects = new[] {
            "Urgent consult","Patient update","Coverage question","Lab follow-up","Discharge plan",
            "Medication clarification","Bed request","Code status discussion","Family concerns",
            "Transfer coordination","Abnormal result notification","PRN order clarification",
            "On-call handoff","Staffing update","Equipment request"
        };
        for (int i = 0; i < 20; i++)
        {
            var t = new MessageThread
            {
                TenantId = mercy.Id,
                Subject = threadSubjects[rng.Next(threadSubjects.Length)],
                Urgent = rng.Next(5) == 0,
                LastMessageAt = DateTime.UtcNow.AddMinutes(-rng.Next(0, 4320)),
                Participants = $"Albert Drobo, {attendings[rng.Next(attendings.Length)]}, {rns[rng.Next(rns.Length)]}"
            };
            db.MessageThreads.Add(t);
            await db.SaveChangesAsync();
            var msgBodies = new[] {
                "Following up on the patient — please advise.",
                "Lab results are back. Please review at your earliest convenience.",
                "Patient's family is requesting an update. Can we schedule a meeting?",
                "Discharge planning in progress. Need your input on medications.",
                "Coverage for tonight — any pending issues I should know about?",
                "Please review and co-sign the order when you get a chance.",
                "Patient deteriorating slightly. Vitals attached. Thoughts?",
            };
            for (int j = 0; j < rng.Next(2, 8); j++)
            {
                db.Messages.Add(new Message
                {
                    TenantId = mercy.Id, ThreadId = t.Id,
                    SenderName = j % 2 == 0 ? "Albert Drobo" : attendings[rng.Next(attendings.Length)],
                    Body = msgBodies[rng.Next(msgBodies.Length)],
                    SentAt = DateTime.UtcNow.AddMinutes(-rng.Next(0, 4320)),
                    Read = j < 3
                });
            }
        }
        await db.SaveChangesAsync();

        // ── More Claims ───────────────────────────────────────────
        var cptCodes = new[] {
            ("99213","Office Visit — E&M Level 3"), ("99214","Office Visit — E&M Level 4"),
            ("99232","Subsequent Inpatient E&M"), ("99233","Subsequent Inpatient E&M Complex"),
            ("93000","12-lead ECG with interpretation"), ("71046","CXR 2 views"),
            ("80053","CMP panel"), ("85025","CBC with differential"),
            ("36415","Venipuncture"), ("99291","Critical care, first hour")
        };
        for (int i = 0; i < 80; i++)
        {
            var pat = patients[rng.Next(patients.Count)];
            var cpt = cptCodes[rng.Next(cptCodes.Length)];
            db.Claims.Add(new Claim
            {
                TenantId = mercy.Id, PatientId = pat.Id,
                ClaimNumber = $"CLM{rng.Next(100000, 999999)}",
                Payer = payers[rng.Next(payers.Length)],
                CptCode = cpt.Item1,
                ServiceDescription = cpt.Item2,
                DateOfService = DateTime.UtcNow.AddDays(-rng.Next(0, 180)),
                Amount = (decimal)Math.Round(80 + rng.NextDouble() * 7920, 2),
                Status = cstats[rng.Next(cstats.Length)],
                DenialReason = rng.Next(8) == 0 ? new[]{"CO-50 — Not medically necessary","CO-4 — Service inconsistent with modifier","PR-96 — Non-covered charge","CO-18 — Duplicate claim","CO-97 — Payment included in allowance"}[rng.Next(5)] : ""
            });
        }
        await db.SaveChangesAsync();

        // ── More Inventory ────────────────────────────────────────
        var supplies = new[] {
            ("IV Catheter 18G","SUP001","Supply"), ("IV Catheter 20G","SUP002","Supply"),
            ("Foley Catheter 16Fr","SUP003","Supply"), ("Urinary Bag 2000mL","SUP004","Supply"),
            ("Suture 4-0 Vicryl","SUP005","Supply"), ("Staple Remover","SUP006","Supply"),
            ("Wound Dressing 4x4","SUP007","Supply"), ("Elastic Bandage 4in","SUP008","Supply"),
            ("PPE Gown","SUP009","PPE"), ("N95 Respirator","SUP010","PPE"),
            ("Exam Gloves M","SUP011","PPE"), ("Exam Gloves L","SUP012","PPE"),
            ("Syringe 10mL","SUP013","Supply"), ("Syringe 60mL","SUP014","Supply"),
            ("Alcohol Prep Pad","SUP015","Supply"), ("Blood Glucose Strips","SUP016","Diagnostic"),
            ("Pulse Oximeter","SUP017","Equipment"), ("BP Cuff Adult","SUP018","Equipment"),
        };
        foreach (var (name, sku, cat) in supplies)
        {
            db.InventoryItems.Add(new InventoryItem
            {
                TenantId = mercy.Id,
                Name = name, Ndc = "", Sku = sku,
                Category = cat,
                OnHand = rng.Next(10, 500), ParLevel = 100,
                Location = new[]{"Central Supply","Storeroom A","Storeroom B","Floor Cart 3W","Floor Cart ICU"}[rng.Next(5)],
                LotNumber = $"L{rng.Next(10000, 99999)}",
                ExpiresAt = cat == "PPE" || cat == "Supply" ? DateTime.UtcNow.AddDays(rng.Next(30, 1080)) : DateTime.UtcNow.AddYears(5),
                UnitCost = (decimal)Math.Round(0.5 + rng.NextDouble() * 49.5, 2)
            });
        }
        await db.SaveChangesAsync();

        // ── ED Arrivals (more, for Northcare + Riverside) ─────────
        for (int i = 0; i < 14; i++)
        {
            db.EDArrivals.Add(new EDArrival
            {
                TenantId = riverside.Id,
                PatientName = $"{firstNames[rng.Next(firstNames.Length)]} {lastNames[rng.Next(lastNames.Length)]}",
                Age = rng.Next(16, 85), Sex = rng.Next(2)==0?"M":"F",
                ChiefComplaint = new[]{"GSW abdomen","MVC — polytrauma","Fall from height","Stab wound chest","Burn injury","ATV rollover","Crush injury"}[rng.Next(7)],
                EsiLevel = rng.Next(1, 3), // mostly level 1-2 for trauma
                ArrivalMode = new[]{"EMS","Air transport","POV"}[rng.Next(3)],
                ArrivedAt = DateTime.UtcNow.AddMinutes(-rng.Next(0, 180)),
                Status = new[]{"triaged","in-bed","dispo"}[rng.Next(3)],
                Bay = $"TBY-{rng.Next(1,9)}",
                Hr = 70+rng.Next(80), Sbp = 80+rng.Next(80), Spo2 = 85+rng.Next(15)
            });
        }
        await db.SaveChangesAsync();

        // ── Audit Trail ───────────────────────────────────────────
        var auditActions = new[] { "Login","Login","ViewChart","ViewChart","ViewChart","OrderSigned","OrderCancelled","NoteCreated","NoteSigned","ResultViewed","ResultAcknowledged","ClaimSubmitted","PatientAdmitted","PatientDischarged","PasswordChanged","TenantSwitched","SettingsUpdated","ReportExported" };
        var auditResources = new[] { "Patient","Order","Note","LabResult","Claim","User","Encounter","Document" };
        for (int i = 0; i < 150; i++)
        {
            var action = auditActions[rng.Next(auditActions.Length)];
            var resource = auditResources[rng.Next(auditResources.Length)];
            var pat = patients[rng.Next(patients.Count)];
            db.AuditEntries.Add(new AuditEntry
            {
                TenantId = mercy.Id,
                UserId = demo.Id,
                Action = action,
                Resource = resource,
                Detail = $"{action} on {resource} — Patient {pat.Mrn}",
                At = DateTime.UtcNow.AddMinutes(-rng.Next(0, 10080))
            });
        }
        await db.SaveChangesAsync();
    }
}

