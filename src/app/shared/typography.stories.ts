import { ReactiveFormsModule } from "@angular/forms";
import { moduleMetadata } from "@storybook/angular";
import { withKnobs } from "@storybook/addon-knobs";
import { MaterialModule } from "src/app/shared/material.module";
import { RouterTestingModule } from "@angular/router/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";

export default {
  title: "General Styling",
  decorators: [
    moduleMetadata({
      imports: [
        MaterialModule,
        ReactiveFormsModule,
        RouterTestingModule,
        HttpClientTestingModule
      ]
    }),
    withKnobs
  ]
};

export const typography = () => ({
  template: `
  <section>
    <article class="mat-typography">
      <h1>Angular Material typography</h1>
      <p><a href="https://material.angular.io/guide/typography">Reference</a></p>
      <p>This section is wrapped with class "mat-typography"</p>
      <p>You can also cutomize with specific classes, as displayed below</p>
    </article>

    <mat-divider></mat-divider>

    <p class="mat-h4 mat-subheading-1">
      mat-display-4: Large, one-off header, usually at the top of the page (e.g.
      a hero header).
    </p>
    <p class="mat-display-4">The quick brown fox jumps over the lazy dog</p>

    <mat-divider></mat-divider>

    <p class="mat-h4 mat-subheading-1">
      mat-display-3: Large, one-off header, usually at the top of the page (e.g.
      a hero header).
    </p>
    <p class="mat-display-3">The quick brown fox jumps over the lazy dog</p>

    <mat-divider></mat-divider>

    <p class="mat-h4 mat-subheading-1">
    mat-display-2: Large, one-off header, usually at the top of the page (e.g.
    a hero header).
    </p>
    <p class="mat-display-2">The quick brown fox jumps over the lazy dog</p>

    <mat-divider></mat-divider>

    <p class="mat-h4 mat-subheading-1">
    mat-display-1: Large, one-off header, usually at the top of the page (e.g.
    a hero header).
    </p>
    <p class="mat-display-1">The quick brown fox jumps over the lazy dog</p>

    <mat-divider></mat-divider>

    <p class="mat-h4 mat-subheading-1">
    mat-h1, mat-headline: Section heading corresponding to the h1 tag.
    </p>
    <h1 class="mat-h1 mat-headline">The quick brown fox jumps over the lazy dog</h1>

    <mat-divider></mat-divider>

    <p class="mat-h4 mat-subheading-1">
    mat-h2, mat-title: Section heading corresponding to the h2 tag.
    </p>
    <h2 class="mat-h2 mat-title">The quick brown fox jumps over the lazy dog</h2>

    <mat-divider></mat-divider>

    <p class="mat-h4 mat-subheading-1">
    mat-h3, mat-subheading-2: Section heading corresponding to the h3 tag.
    </p>
    <h3 class="mat-h3 mat-subheading-2">The quick brown fox jumps over the lazy dog</h3>

    <mat-divider></mat-divider>

    <p class="mat-h4 mat-subheading-1">
    mat-h4, mat-subheading-1: Section heading corresponding to the h4 tag.
    </p>
    <h4 class="mat-h4 mat-subheading-1">The quick brown fox jumps over the lazy dog</h4>

    <mat-divider></mat-divider>

    <p class="mat-h4 mat-subheading-1">
    mat-body, mat-body-1: Base body text.
    </p>
    <p class="mat-body mat-body-1">The quick brown fox jumps over the lazy dog</p>

    <mat-divider></mat-divider>

    <p class="mat-h4 mat-subheading-1">
    mat-body-strong, mat-body-2: Bolder body text.
    </p>
    <p class="mat-body-strong mat-body-2">The quick brown fox jumps over the lazy dog</p>

    <mat-divider></mat-divider>

    <p class="mat-h4 mat-subheading-1">
    mat-small, mat-caption: Smaller body and hint text.
    </p>
    <p class="mat-small mat-caption">The quick brown fox jumps over the lazy dog</p>

    <mat-divider></mat-divider>
  </section>
  `
});

export const icons = () => ({
  template: `
  <section class="mat-typography">
    <h1>Icons</h1>
    <p>Angular material has a bunch of icons. You can find a pretty exhaustive list of them <a href="https://www.angularjswiki.com/angular/angular-material-icons-list-mat-icon-list/">here</a>
    <p>Also, <a href="https://material.angular.io/components/icon/overview">here's</a> Angular's documentation on icons</p>
    <p>Make sure to add the appropriate aria classes for accessibility!</p>
    <mat-divider></mat-divider>
    <mat-icon>delete</mat-icon>
    <p aria-hidden="false" aria-label="this is trash">This is an icon</p>
    <button mat-icon-button color="accent" aria-label="Example icon-button with a heart icon">
      <mat-icon>favorite</mat-icon>
    </button>
    <p>This is a button icon</p>
    <button mat-flat-button color="primary">
      <mat-icon aria-hidden="true">done</mat-icon>
      Resolve
    </button>
    <p>If the icon is purely decorative, you can make aria hidden true</p>
  </section>
  `
});

typography.story = {
  parameters: {
    notes:
      "Oh hey you can leave notes. Why is the alignment so weird though? Not sure if this is a great place to take notes."
  }
};
