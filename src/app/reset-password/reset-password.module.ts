import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule } from "@angular/forms";
import { MaterialModule } from "../shared/material.module";
import { SharedModule } from "../shared/shared.module";
import { ResetPasswordComponent } from "./reset-password.component";
import { ResetPasswordRoutingModule } from "./reset-password-routing.module";
import { SetNewPasswordComponent } from "./set-new-password/set-new-password.component";

@NgModule({
  declarations: [ResetPasswordComponent, SetNewPasswordComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    ResetPasswordRoutingModule,
    SharedModule,
  ],
})
export class ResetPasswordModule {}
