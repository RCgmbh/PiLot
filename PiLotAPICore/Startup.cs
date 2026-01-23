using System;
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
			this.ConfigureStaticFiles(app);
			app.UseRouting();
			app.UseForwardedHeaders(new ForwardedHeadersOptions {
				ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
			});
			app.UseEndpoints(endpoints => {
				endpoints.MapControllers();
			});
		}

		/// <summary>
		/// Configures static files, so that files in wwwroot will be delivered as static files
		/// This depends on the app.config value "staticFiles" having a value of "true"
		/// </summary>
		/// <param name="app"></param>
		private void ConfigureStaticFiles(IApplicationBuilder app){
			Boolean.TryParse(System.Configuration.ConfigurationManager.AppSettings["staticFiles"], out Boolean staticFiles);
			if(staticFiles){
				app.UseFileServer();
			}
		}
	}
}
