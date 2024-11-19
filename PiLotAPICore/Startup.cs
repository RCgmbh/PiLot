using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;

using PiLot.API.ActionFilters;

namespace PiLot.API{

	public class Startup { 

		public Startup(IConfiguration configuration) {
			Configuration = configuration;
		}

		public IConfiguration Configuration { get; }

		// This method gets called by the runtime. Use this method to add services to the container.
		public void ConfigureServices(IServiceCollection services) {
			services.AddScoped<ReadAuthorizationFilter>();
			services.AddScoped<WriteAuthorizationFilter>();
			services.AddScoped<SettingsAuthorizationFilter>();
			services.AddScoped<SystemAuthorizationFilter>();
			services.AddScoped<LocalAuthorizationFilter>();
			services.AddControllers();
			services.AddHttpContextAccessor();
		}

		// This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
		public void Configure(IApplicationBuilder app, IWebHostEnvironment env) {
			if (env.IsDevelopment()) {
				app.UseDeveloperExceptionPage();
			}
			app.UseFileServer();
			app.UseRouting();
			app.UseForwardedHeaders(new ForwardedHeadersOptions {
				ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
			});
			app.UseEndpoints(endpoints => {
				endpoints.MapControllers();
			});
		}
	}
}
