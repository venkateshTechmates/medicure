using MedCure.Api.Auth;
using MedCure.Api.Data.Repositories;
using MedCure.Api.Domain.Entities;

namespace MedCure.Api.Data;

public class UnitOfWork(AppDbContext db, ICurrentUser current) : IUnitOfWork
{
    private readonly AppDbContext _db = db;

    private IRepository<Tenant>?                  _tenants;
    private IRepository<UserTenant>?              _userTenants;
    private IRepository<Ward>?                    _wards;
    private IRepository<Bed>?                     _beds;
    private IRepository<Allergy>?                 _allergies;
    private IRepository<Problem>?                 _problems;
    private IRepository<Vital>?                   _vitals;
    private IRepository<Encounter>?               _encounters;
    private IRepository<Appointment>?             _appointments;
    private IRepository<MedicationAdministration>? _medAdmins;
    private IRepository<Specimen>?                _specimens;
    private IRepository<Note>?                    _notes;
    private IRepository<Document>?                _documents;
    private IRepository<MessageThread>?           _msgThreads;
    private IRepository<Message>?                 _messages;
    private IRepository<Claim>?                   _claims;
    private IRepository<InventoryItem>?           _inventory;
    private IRepository<EDArrival>?               _edArrivals;
    private IRepository<CdsAlert>?                _cdsAlerts;
    private IRepository<AuditEntry>?              _audit;
    private IRepository<Immunization>?            _imms;
    private IRepository<ConsultRequest>?          _consults;
    private IRepository<TransferRequest>?         _transfers;
    private IRepository<CodeEvent>?               _codes;
    private IRepository<Notification>?            _notifs;
    private IRepository<CdsRule>?                 _cdsRules;
    private IRepository<CdsOverride>?             _cdsOverrides;
    private IRepository<MedReconciliation>?       _medRecs;
    private IRepository<MedReconciliationLine>?   _medRecLines;
    private IRepository<Assessment>?              _assessments;
    private IRepository<InbasketItem>?            _inbasketDelegations;

    private IUserRepository?      _users;
    private IPatientRepository?   _patients;
    private IOrderRepository?     _orders;
    private ILabResultRepository? _labs;

    public IRepository<Tenant>                  Tenants       => _tenants     ??= new Repository<Tenant>(db, current);
    public IRepository<UserTenant>              UserTenants   => _userTenants ??= new Repository<UserTenant>(db, current);
    public IRepository<Ward>                    Wards         => _wards       ??= new Repository<Ward>(db, current);
    public IRepository<Bed>                     Beds          => _beds        ??= new Repository<Bed>(db, current);
    public IRepository<Allergy>                 Allergies     => _allergies   ??= new Repository<Allergy>(db, current);
    public IRepository<Problem>                 Problems      => _problems    ??= new Repository<Problem>(db, current);
    public IRepository<Vital>                   Vitals        => _vitals      ??= new Repository<Vital>(db, current);
    public IRepository<Encounter>               Encounters    => _encounters  ??= new Repository<Encounter>(db, current);
    public IRepository<Appointment>             Appointments  => _appointments??= new Repository<Appointment>(db, current);
    public IRepository<MedicationAdministration> MedAdmins    => _medAdmins   ??= new Repository<MedicationAdministration>(db, current);
    public IRepository<Specimen>                Specimens     => _specimens   ??= new Repository<Specimen>(db, current);
    public IRepository<Note>                    Notes         => _notes       ??= new Repository<Note>(db, current);
    public IRepository<Document>                Documents     => _documents   ??= new Repository<Document>(db, current);
    public IRepository<MessageThread>           MessageThreads=> _msgThreads  ??= new Repository<MessageThread>(db, current);
    public IRepository<Message>                 Messages      => _messages    ??= new Repository<Message>(db, current);
    public IRepository<Claim>                   Claims        => _claims      ??= new Repository<Claim>(db, current);
    public IRepository<InventoryItem>           InventoryItems=> _inventory   ??= new Repository<InventoryItem>(db, current);
    public IRepository<EDArrival>               EDArrivals    => _edArrivals  ??= new Repository<EDArrival>(db, current);
    public IRepository<CdsAlert>                CdsAlerts     => _cdsAlerts   ??= new Repository<CdsAlert>(db, current);
    public IRepository<AuditEntry>              AuditEntries  => _audit       ??= new Repository<AuditEntry>(db, current);
    public IRepository<Immunization>            Immunizations => _imms        ??= new Repository<Immunization>(db, current);
    public IRepository<ConsultRequest>          ConsultRequests => _consults  ??= new Repository<ConsultRequest>(db, current);
    public IRepository<TransferRequest>         TransferRequests => _transfers ??= new Repository<TransferRequest>(db, current);
    public IRepository<CodeEvent>               CodeEvents    => _codes       ??= new Repository<CodeEvent>(db, current);
    public IRepository<Notification>            Notifications => _notifs      ??= new Repository<Notification>(db, current);
    public IRepository<CdsRule>                 CdsRules      => _cdsRules    ??= new Repository<CdsRule>(db, current);
    public IRepository<CdsOverride>             CdsOverrides  => _cdsOverrides??= new Repository<CdsOverride>(db, current);
    public IRepository<MedReconciliation>       MedReconciliations => _medRecs ??= new Repository<MedReconciliation>(db, current);
    public IRepository<MedReconciliationLine>   MedReconciliationLines => _medRecLines ??= new Repository<MedReconciliationLine>(db, current);
    public IRepository<Assessment>              Assessments   => _assessments ??= new Repository<Assessment>(db, current);
    public IRepository<InbasketItem>            InbasketDelegations => _inbasketDelegations ??= new Repository<InbasketItem>(db, current);

    public IUserRepository      Users      => _users    ??= new UserRepository(db, current);
    public IPatientRepository   Patients   => _patients ??= new PatientRepository(db, current);
    public IOrderRepository     Orders     => _orders   ??= new OrderRepository(db, current);
    public ILabResultRepository LabResults => _labs     ??= new LabResultRepository(db, current);

    public Task<int> SaveAsync(CancellationToken ct = default) => _db.SaveChangesAsync(ct);

    public ValueTask DisposeAsync() => _db.DisposeAsync();
}
