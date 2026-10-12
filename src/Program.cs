// register the evaluation license for VintaSoft Barcode .NET SDK
Vintasoft.Barcode.BarcodeGlobalSettings.Register("REG_USER", "REG_EMAIL", "EXPIRATION_DATE", "REG_CODE");

var builder = WebApplication.CreateBuilder(args);

// specify that VintaSoft Barcode .NET SDK should use SkiaSharp library for drawing of 2D graphics
Vintasoft.Barcode.SkiaSharpAssembly.Init();

#if !DISABLE_AI
try
{
    // initialize Vintasoft.Barcode.AI.1D assembly
    Vintasoft.Barcode.Ai1DAssembly.Init();
}
catch
{
#if DEBUG
    throw;
#endif
}

try
{
    // initialize Vintasoft.Barcode.AI.2D assembly
    Vintasoft.Barcode.Ai2DAssembly.Init();
}
catch
{
#if DEBUG
    throw;
#endif
}
#endif


// Add services to the container.

builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromSeconds(10);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

builder.Services.AddControllersWithViews().AddNewtonsoftJson();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseSession();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller}/{action=Index}/{id?}");

app.MapFallbackToFile("index.html");

app.Run();
