using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedCure.Api.Migrations
{
    /// <inheritdoc />
    public partial class OrphanEntitiesWiring : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DiscontinuedAt",
                table: "Orders",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DiscontinuedReason",
                table: "Orders",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "EnteredByUserId",
                table: "Orders",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "OrderingMdId",
                table: "Orders",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Revision",
                table: "Orders",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "VerbalCosignDue",
                table: "Orders",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Kind",
                table: "AuditEntries",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Reason",
                table: "AuditEntries",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "TargetPatientId",
                table: "AuditEntries",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Assessments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    PatientId = table.Column<int>(type: "INTEGER", nullable: false),
                    EncounterId = table.Column<int>(type: "INTEGER", nullable: true),
                    PerformedByUserId = table.Column<int>(type: "INTEGER", nullable: false),
                    Kind = table.Column<string>(type: "TEXT", nullable: false),
                    Tool = table.Column<string>(type: "TEXT", nullable: false),
                    Score = table.Column<int>(type: "INTEGER", nullable: false),
                    Risk = table.Column<string>(type: "TEXT", nullable: false),
                    DetailsJson = table.Column<string>(type: "TEXT", nullable: false),
                    Notes = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    TenantId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Assessments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Assessments_Encounters_EncounterId",
                        column: x => x.EncounterId,
                        principalTable: "Encounters",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Assessments_Patients_PatientId",
                        column: x => x.PatientId,
                        principalTable: "Patients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Assessments_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CdsOverrides",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    RuleKey = table.Column<string>(type: "TEXT", nullable: false),
                    PatientId = table.Column<int>(type: "INTEGER", nullable: false),
                    OrderId = table.Column<int>(type: "INTEGER", nullable: true),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    ReasonCode = table.Column<string>(type: "TEXT", nullable: false),
                    ReasonText = table.Column<string>(type: "TEXT", nullable: false),
                    Severity = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    TenantId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CdsOverrides", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CdsOverrides_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CdsRules",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    RuleKey = table.Column<string>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Family = table.Column<string>(type: "TEXT", nullable: false),
                    Severity = table.Column<string>(type: "TEXT", nullable: false),
                    Enabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    Threshold = table.Column<string>(type: "TEXT", nullable: false),
                    Message = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    TenantId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CdsRules", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CdsRules_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "InbasketDelegations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    OwnerUserId = table.Column<int>(type: "INTEGER", nullable: false),
                    DelegateUserId = table.Column<int>(type: "INTEGER", nullable: true),
                    DelegateFromUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    DelegateToUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Folders = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    TenantId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InbasketDelegations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InbasketDelegations_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MedReconciliations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    EncounterId = table.Column<int>(type: "INTEGER", nullable: false),
                    PatientId = table.Column<int>(type: "INTEGER", nullable: false),
                    TransitionType = table.Column<string>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false),
                    PerformedByUserId = table.Column<int>(type: "INTEGER", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    Notes = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    TenantId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MedReconciliations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MedReconciliations_Encounters_EncounterId",
                        column: x => x.EncounterId,
                        principalTable: "Encounters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MedReconciliations_Patients_PatientId",
                        column: x => x.PatientId,
                        principalTable: "Patients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MedReconciliations_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MedReconciliationLines",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ReconciliationId = table.Column<int>(type: "INTEGER", nullable: false),
                    DrugName = table.Column<string>(type: "TEXT", nullable: false),
                    Dose = table.Column<string>(type: "TEXT", nullable: false),
                    Route = table.Column<string>(type: "TEXT", nullable: false),
                    Frequency = table.Column<string>(type: "TEXT", nullable: false),
                    Source = table.Column<string>(type: "TEXT", nullable: false),
                    Action = table.Column<string>(type: "TEXT", nullable: false),
                    ActionReason = table.Column<string>(type: "TEXT", nullable: false),
                    NewDose = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    TenantId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MedReconciliationLines", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MedReconciliationLines_MedReconciliations_ReconciliationId",
                        column: x => x.ReconciliationId,
                        principalTable: "MedReconciliations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MedReconciliationLines_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Assessments_EncounterId",
                table: "Assessments",
                column: "EncounterId");

            migrationBuilder.CreateIndex(
                name: "IX_Assessments_PatientId",
                table: "Assessments",
                column: "PatientId");

            migrationBuilder.CreateIndex(
                name: "IX_Assessments_TenantId",
                table: "Assessments",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_CdsOverrides_TenantId",
                table: "CdsOverrides",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_CdsRules_TenantId",
                table: "CdsRules",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_InbasketDelegations_TenantId",
                table: "InbasketDelegations",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_MedReconciliationLines_ReconciliationId",
                table: "MedReconciliationLines",
                column: "ReconciliationId");

            migrationBuilder.CreateIndex(
                name: "IX_MedReconciliationLines_TenantId",
                table: "MedReconciliationLines",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_MedReconciliations_EncounterId",
                table: "MedReconciliations",
                column: "EncounterId");

            migrationBuilder.CreateIndex(
                name: "IX_MedReconciliations_PatientId",
                table: "MedReconciliations",
                column: "PatientId");

            migrationBuilder.CreateIndex(
                name: "IX_MedReconciliations_TenantId",
                table: "MedReconciliations",
                column: "TenantId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Assessments");

            migrationBuilder.DropTable(
                name: "CdsOverrides");

            migrationBuilder.DropTable(
                name: "CdsRules");

            migrationBuilder.DropTable(
                name: "InbasketDelegations");

            migrationBuilder.DropTable(
                name: "MedReconciliationLines");

            migrationBuilder.DropTable(
                name: "MedReconciliations");

            migrationBuilder.DropColumn(
                name: "DiscontinuedAt",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "DiscontinuedReason",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "EnteredByUserId",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "OrderingMdId",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "Revision",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "VerbalCosignDue",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "Kind",
                table: "AuditEntries");

            migrationBuilder.DropColumn(
                name: "Reason",
                table: "AuditEntries");

            migrationBuilder.DropColumn(
                name: "TargetPatientId",
                table: "AuditEntries");
        }
    }
}
