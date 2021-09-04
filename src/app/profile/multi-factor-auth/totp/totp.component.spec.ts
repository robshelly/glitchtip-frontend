import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { SharedModule } from "src/app/shared/shared.module";
import { totpUserKey } from "./test-data";
import { TOTPComponent } from "./totp.component";

describe("TotpComponent", () => {
  let component: TOTPComponent;
  let fixture: ComponentFixture<TOTPComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TOTPComponent],
      imports: [HttpClientTestingModule, SharedModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TOTPComponent);
    component = fixture.componentInstance;
  });

  it("should show get started without TOTP Key", () => {
    fixture.detectChanges();
    const button: HTMLElement = fixture.nativeElement.querySelector("button");
    expect(button.innerText).toContain("Get Started");
  });

  it("should show get started with TOTP key", () => {
    component.TOTPKey$ = of(totpUserKey);
    fixture.detectChanges();
    const button: HTMLElement = fixture.nativeElement.querySelector("button");
    expect(button.innerText).toContain("Disable two-factor");
  });
});