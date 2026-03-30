import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';

const SuiviMedicalForm = () => {

  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nom:'',
    prenom:'',
    service:'',
    date_delivrance:'',
    date_expiration:'',
    type_certificat:'',
    clinique:''
  });

  useEffect(()=>{

    if(id) charger();

  },[id]);

  const charger = async () => {

    const res = await fetch(
      `http://localhost:8000/api/suivi-medical/${id}/`,
      {
        headers:{
          Authorization:`Bearer ${localStorage.getItem('ofis_token')}`
        }
      }
    );

    const data = await res.json();

    setForm(data);

  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    const method = id ? "PUT" : "POST";

    const url = id
      ? `http://localhost:8000/api/suivi-medical/${id}/`
      : `http://localhost:8000/api/suivi-medical/`;

    const res = await fetch(url,{
      method,
      headers:{
        'Content-Type':'application/json',
        Authorization:`Bearer ${localStorage.getItem('ofis_token')}`
      },
      body:JSON.stringify(form)
    });

    if(res.ok){

      navigate('/assistante/suivi-medical');

    }else{

      alert("Erreur");

    }

  };

  return (

    <div className="dashboard-page">

      <h1>{id ? "Modifier" : "Ajouter"} un suivi médical</h1>

      <Card>

        <form onSubmit={handleSubmit}>

          <Input
            label="Nom"
            value={form.nom}
            onChange={(e)=>setForm({...form,nom:e.target.value})}
          />

          <Input
            label="Prénom"
            value={form.prenom}
            onChange={(e)=>setForm({...form,prenom:e.target.value})}
          />

          <Input
            label="Service"
            value={form.service}
            onChange={(e)=>setForm({...form,service:e.target.value})}
          />

          <Input
            type="date"
            label="Date délivrance"
            value={form.date_delivrance}
            onChange={(e)=>setForm({...form,date_delivrance:e.target.value})}
          />

          <Input
            type="date"
            label="Date expiration"
            value={form.date_expiration}
            onChange={(e)=>setForm({...form,date_expiration:e.target.value})}
          />

          <Input
            label="Type certificat"
            value={form.type_certificat}
            onChange={(e)=>setForm({...form,type_certificat:e.target.value})}
          />

          <Input
            label="Clinique"
            value={form.clinique}
            onChange={(e)=>setForm({...form,clinique:e.target.value})}
          />

          <Button type="submit">
            Enregistrer
          </Button>

        </form>

      </Card>

    </div>

  );

};

export default SuiviMedicalForm;