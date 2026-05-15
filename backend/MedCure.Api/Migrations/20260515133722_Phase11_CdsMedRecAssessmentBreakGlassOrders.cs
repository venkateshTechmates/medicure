using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedCure.Api.Migrations
{
    /// <inheritdoc />
    public partial class Phase11_CdsMedRecAssessmentBreakGlassOrders : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_CdsRules_TenantId",
                table: "CdsRules");

            migrationBuilder.DropIndex(
                name: "IX_CdsOverrides_TenantId",
                table: "CdsOverrides");

            migrationBuilder.AddColumn<bool>(
                name: "TotpEnabled",
                table: "Users",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "TwoFactorSecrets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    EncryptedSecret = table.Column<string>(type: "TEXT", nullable: false),
                    BackupCodes = table.Column<string>(type: "TEXT", nullable: false),
                    EnrolledAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    LastUsedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    Enabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    TenantId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TwoFactorSecrets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TwoFactorSecrets_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CdsRules_TenantId_RuleKey",
                table: "CdsRules",
                columns: new[] { "TenantId", "RuleKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CdsOverrides_TenantId_RuleKey_CreatedAt",
                table: "CdsOverrides",
                columns: new[] { "TenantId", "RuleKey", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_TwoFactorSecrets_TenantId",
                table: "TwoFactorSecrets",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_TwoFactorSecrets_UserId",
                table: "TwoFactorSecrets",
                column: "UserId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TwoFactorSecrets");

            migrationBuilder.DropIndex(
                name: "IX_CdsRules_TenantId_RuleKey",
                table: "CdsRules");

            migrationBuilder.DropIndex(
                name: "IX_CdsOverrides_TenantId_RuleKey_CreatedAt",
                table: "CdsOverrides");

            migrationBuilder.DropColumn(
                name: "TotpEnabled",
                table: "Users");

            migrationBuilder.CreateIndex(
                name: "IX_CdsRules_TenantId",
                table: "CdsRules",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_CdsOverrides_TenantId",
                table: "CdsOverrides",
                column: "TenantId");
        }
    }
}
