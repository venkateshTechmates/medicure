using MedCure.Api.Auth;
using MedCure.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Data;

public static class DbInitializer
{
    public static async Task RunAsync(AppDbContext db)
    {
        await db.Database.MigrateAsync();
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
        var ccs = new[] { "Chest pain","SOB","Abdominal pain","Headache","Fall","Lac to scalp","Fever","RLQ pain","Back pain","Sepsis r/o","AMS","Syncope","Palpitations","Edema","Hemoptysis","Nausea/vomiting","Dysuria","Hip pain","Shoulder pain","Weakness" };
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
                    ChiefComplaint = ccs[rng.Next(ccs.Length)],
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
        await db.SaveChangesAsync();
    }
}
