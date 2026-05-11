using ArchiCredit.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ArchiCredit.Tests;

public class TestDbContext(DbContextOptions<AppDbContext> options) : AppDbContext(options);
