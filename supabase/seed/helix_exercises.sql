-- HELIX exercise seed data
-- Run with: supabase db execute -f supabase/seed/helix_exercises.sql

with data (name, description, tags) as (
  values
    ('Dumbbell Goblet Squat',
     'Lower-body squat pattern using a single dumbbell for home or gym settings.',
     '{"equipment":["dumbbells"],"pattern":["squat"],"focus":["lower"],"complexity":"beginner","home_friendly":true}'::jsonb),
    ('Kettlebell Deadlift',
     'Hip hinge emphasizing posterior chain engagement with minimal equipment.',
     '{"equipment":["kettlebell","dumbbells"],"pattern":["hinge"],"focus":["lower","posterior_chain"],"complexity":"beginner","home_friendly":true}'::jsonb),
    ('Barbell Back Squat',
     'Compound squat pattern for full gym access and progressive overload.',
     '{"equipment":["barbell","rack"],"pattern":["squat"],"focus":["lower"],"complexity":"intermediate","requires_barbell":true}'::jsonb),
    ('Walking Lunges',
     'Unilateral lower-body movement improving stability and hypertrophy.',
     '{"equipment":["bodyweight","dumbbells"],"pattern":["lunge"],"focus":["lower"],"complexity":"beginner","home_friendly":true}'::jsonb),
    ('Bench Press',
     'Horizontal push compound lift targeting chest, shoulders, and triceps.',
     '{"equipment":["barbell","bench","gym"],"pattern":["push"],"focus":["upper"],"complexity":"intermediate","requires_barbell":true}'::jsonb),
    ('Dumbbell Bench Press',
     'Horizontal push variation accessible with dumbbells or adjustable bench.',
     '{"equipment":["dumbbells","bench"],"pattern":["push"],"focus":["upper"],"complexity":"beginner","home_friendly":false}'::jsonb),
    ('Lat Pulldown',
     'Vertical pull pattern improving lats and upper-back strength.',
     '{"equipment":["cable","gym"],"pattern":["pull"],"focus":["upper"],"complexity":"beginner"}'::jsonb),
    ('Pull-Up / Assisted Pull-Up',
     'Bodyweight vertical pull with progressions for varying strength levels.',
     '{"equipment":["pullup_bar","bands"],"pattern":["pull"],"focus":["upper"],"complexity":"intermediate","home_friendly":true}'::jsonb),
    ('Romanian Deadlift',
     'Hip hinge emphasizing hamstrings and glutes with barbell or dumbbells.',
     '{"equipment":["barbell","dumbbells"],"pattern":["hinge"],"focus":["posterior_chain"],"complexity":"intermediate"}'::jsonb),
    ('Tempo Push-Up',
     'Controlled tempo push-up for upper-body strength and core stability.',
     '{"equipment":["bodyweight"],"pattern":["push"],"focus":["upper","core"],"complexity":"beginner","home_friendly":true}'::jsonb),
    ('Single-Arm Dumbbell Row',
     'Unilateral pull improving lat and scapular strength with minimal equipment.',
     '{"equipment":["dumbbells","bench"],"pattern":["pull"],"focus":["upper","posterior_chain"],"complexity":"beginner","home_friendly":true}'::jsonb),
    ('Band Face Pull',
     'Posterior delt and mid-back activation with light resistance.',
     '{"equipment":["bands"],"pattern":["pull"],"focus":["upper"],"complexity":"beginner","home_friendly":true}'::jsonb)
)
insert into exercises (name, description, tags)
select d.name, d.description, d.tags
from data as d
where not exists (
  select 1 from exercises e where e.name = d.name
);
