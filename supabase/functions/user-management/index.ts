import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Prefer role from JWT/app metadata when available to avoid extra queries.
    const claimedRole = user.app_metadata?.role;
    let isAdmin = claimedRole === 'admin';

    // Fallback to the project's users table role model when claim is absent.
    if (claimedRole === undefined || claimedRole === null || claimedRole === '') {
      const { data: roleRow, error: roleError } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (roleError) {
        return new Response(
          JSON.stringify({ error: roleError.message }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      isAdmin = roleRow?.role === 'admin';
    }

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const url = new URL(req.url);
    const path = (() => {
      const p = url.pathname;
      const idx = p.indexOf('/user-management');
      if (idx === -1) return p;
      return p.slice(idx + '/user-management'.length) || '/';
    })();

    if (req.method === 'GET' && path === '/list') {
      const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ users }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (req.method === 'POST' && path === '/create') {
      const body = await req.json();
      const { email, password } = body;
      const roleRaw = typeof body.role === 'string' ? body.role.toLowerCase() : 'staff';
      const role =
        roleRaw === 'admin' || roleRaw === 'manager' || roleRaw === 'staff' ? roleRaw : 'staff';

      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: 'Email and password are required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (error || !data?.user) {
        return new Response(
          JSON.stringify({ error: error?.message ?? 'Failed to create auth user' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const newUser = data.user;
      const username = email.trim();

      const { error: profileError } = await supabaseAdmin.from('users').insert({
        id: newUser.id,
        username,
        role,
      });

      if (profileError) {
        await supabaseAdmin.auth.admin.deleteUser(newUser.id);
        return new Response(
          JSON.stringify({
            error: `Auth user was created but staff profile failed: ${profileError.message}. Rolled back.`,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ user: newUser, role }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (req.method === 'DELETE' && path.startsWith('/delete/')) {
      const userId = path.replace('/delete/', '');

      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'User ID is required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});