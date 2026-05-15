using MedCure.Api.Domain.Entities;

namespace MedCure.Api.Services;

public interface INews2Service
{
    int Score(Vital v);
    string Risk(int score); // "low", "medium", "high"
}
