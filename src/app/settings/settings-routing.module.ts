import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { ProjectsComponent } from "./projects/projects.component";
import { NewProjectComponent } from "./projects/new-project/new-project.component";
import { ProjectDetailComponent } from "./projects/project-detail/project-detail.component";
import { OrganizationsComponent } from "./organizations/organizations.component";
import { OrganizationDetailComponent } from "./organizations/organization-detail/organization-detail.component";
import { NewOrganizationsComponent } from "./organizations/new-organizations/new-organizations.component";
import { SettingsComponent } from "./settings/settings.component";

const routes: Routes = [
  { path: "", component: SettingsComponent },

  { path: "projects", component: ProjectsComponent },
  { path: "projects/new", component: NewProjectComponent },
  { path: "projects/:slug", component: ProjectDetailComponent },

  { path: "organizations", component: OrganizationsComponent },
  { path: "organizations/new", component: NewOrganizationsComponent },
  { path: "organizations/:slug", component: OrganizationDetailComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SettingsRoutingModule {}